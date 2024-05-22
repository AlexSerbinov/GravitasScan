const { EventEmitter } = require("node:events")
const { getProvider } = require("../../../ethers/pool")
const { ethers } = require("ethers")
const { BigNumber } = require("bignumber.js")
const { SIMULATION_RESULT, SIMULATION_ERROR } = require("../../../../configs/eventTopicsConstants")

/**
 * @param {*} filters - object that contains { minHF, maxHF, minBorrow ...}
 * @param {*} config - Main.json
 * @param {*} params - params object from [protocol]filters.json param field
 */
class Fetcher extends EventEmitter {
  constructor(params, filters, config, simulator) {
    super()
    if (new.target === Fetcher) {
      throw new TypeError("Cannot construct Fetcher instances directly")
    }

    const provider = getProvider()
    provider.on("error", e => this.resetProvider())

    this.params = params
    this.config = config
    this.simulator = simulator
    this.filters = filters
    this.provider = provider

    this.helperContract = null
    this.contract = null
    this.globalReservesData = null
    this.wallet = new ethers.Wallet(this.config.HELPER_OWNER_PRIVATE_KEY)
  }

  // /**
  //  * Getting user total debt and collateral
  //  * @param {string} address
  //  * @param {string} blockTag
  //  * @returns {Promise<{healthFactor: number, totalCollateralETH: number, totalBorrowsETH: number}>}
  //  */
  async getUserDataFromNode(address, blockTag) {
    const userData = await this.contract.getUserAccountData(address, {
      blockTag,
    })

    return {
      healthFactor: userData.healthFactor,
      totalCollateralETH: userData.totalCollateralETH,
      totalBorrowsETH: userData.totalBorrowsETH,
    }
  }

  /**
   * Getting user total debt and collateral
   * @param {string} address
   * @param {string} blockTag
   * @returns {Promise<{healthFactor: number, totalCollateralETH: number, totalBorrowsETH: number}>}
   */

  async getUserDataFromSimulator(addresses, blockTag) {
    try {
      const resp = await this.prepareAndSimulateTransaction(addresses)
      if (resp[0].user && resp[0].user != 0x0) {
        const message = `Simulation SUCCESS`
        this.emit("info", message, SIMULATION_RESULT)
      } else {
        const message = `Simulation FAILLED.`
        this.emit("info", message, SIMULATION_ERROR)
      }
      return resp[0]
    } catch (error) {
      // console.error(`simulation error: ${error.message}`)
      console.error(error)
      throw error
    }
  }

  /**
   * Main function to analyze healthFactor, debt and collateral for user
   * @param {object} options
   * @param {string} options.address - user address.
   * @param {string} [options.blockTag="latest"]
   * @returns {Promise<{}>} - filtered list of users
   */
  async loadUserReserves({ address, blockTag = "latest" }) {
    try {
      const { min_health_factor, min_borrow_amount, min_collateral_amount } = this.filters

      const minBorrowAmount = min_borrow_amount * 10 ** 18
      const minCollateralAmount = min_collateral_amount * 10 ** 18

      let healthFactor
      let totalCollateralETH
      let totalBorrowsETH

      if (this.params.useSimulatorInsteadOfNode) {
        ;({ healthFactor, totalCollateralETH, totalBorrowsETH } = await this.getUserDataFromNode(address, blockTag))
      } else if (!this.params.useSimulatorInsteadOfNode) {
        ;({ healthFactor, totalCollateralETH, totalBorrowsETH } = await this.getUserDataFromSimulator(address, blockTag))
      } else {
        throw new Error("Mode should be 'node' or 'simulator'")
      }

      const calcHealthFactor = healthFactor / 10 ** 18
      const totalCollateralETHB = new BigNumber(totalCollateralETH.toString())
      const totalBorrowsETHB = new BigNumber(totalBorrowsETH.toString())
      if (calcHealthFactor <= min_health_factor || totalCollateralETHB.lte(minBorrowAmount) || totalBorrowsETHB.lte(minCollateralAmount)) {
        return { user: address, add: true }
      }

      return { user: address, add: false }

      //skip
    } catch (e) {
      console.error(e)
      return { user: address, error: `loadUserReserves - ${e}` }
    }

    return {}
  }

  /**
   * Fetch user reserves data
   * and make decision what to do next:
   *
   * - Send to searcher
   * - Skip
   *
   * @param {string} user - user address
   */
  async fetchUser(userData) {
    const filteredUser = await this.loadUserReserves({
      address: userData,
    })
    const { user, error } = filteredUser
    if (user && !error) this.emit("fetch", filteredUser)
    if (user && error) this.emit("error", filteredUser)
  }

  /**
   * Prepares and simulates a transaction, then formats the result.
   * @param {Array} addresses - The addresses involved in the transaction.
   * @returns {object} ted simulation result.
   */
  async prepareAndSimulateTransaction(addresses) {
    try {
      const transaction = await this.createTransaction(addresses)
      const simulationResult = await this.simulateTransaction(transaction)
      return this.formatSimulationResult(simulationResult)
    } catch (error) {
      throw error
    }
  }

  /**
   * Creates a transaction object with the given parameters.
   * @param {Array} addresses - The addresses to include in the transaction.
   * @returns {object} The transaction object.
   */
  async createTransaction(addresses) {
    const stateOverrideKey = Object.keys(this.params.stateOverrides)[0]
    const stateOverrideCode = this.params.stateOverrides[stateOverrideKey].code

    return {
      id: 1,
      chainId: 1,
      from: this.wallet.address,
      to: this.params.simulationContract,
      gasLimit: 300000000000000000,
      data: await this.encode(addresses),
      stateOverrides: stateOverrideCode,
      formattedTrace: false,
    }
  }

  /**
   * Simulates a transaction and returns the result.
   * @param {object} transaction - The transaction to simulate.
   * @returns {object} The result of the simulation.
   */
  async simulateTransaction(transaction) {
    try {
      const bundle = [transaction]
      const resp = await this.simulator.simulate(bundle)
      return resp
    } catch (error) {
      // console.error(`simulation error: ${error}`)
      this.emit("errorMessage", error, SIMULATION_ERROR)
      throw error
    }
  }

  /**
   * Formats the raw simulation result into a more readable form.
   * @param {object} simulationResult - The raw simulation result.
   * @returns {Array} ted simulation results.
   */
  async formatSimulationResult(simulationResult) {
    try {
      if (simulationResult.size === 0) {
        throw new Error("simulationResult is empty")
      }
      const returnData = simulationResult.get(1).returnData
      const decodedData = ethers.utils.defaultAbiCoder.decode(["tuple(address user,uint256 totalCollateralETH,uint256 totalBorrowsETH,uint256 healthFactor)[]"], returnData)

      return decodedData[0].map(data => ({
        user: data.user,
        totalCollateralETH: data.totalCollateralETH.toString(),
        totalBorrowsETH: data.totalBorrowsETH.toString(),
        healthFactor: data.healthFactor.toString(),
      }))
    } catch (error) {
      return [
        {
          user: "0x0",
          totalCollateralETH: "0",
          totalBorrowsETH: "0",
          healthFactor: "0",
        },
      ]
    }
  }

  /**
   * Encodes the addresses into a single data string using the contract's ABI.
   * @param {Array} addresses - The addresses to encode.
   * @returns {string} The encoded data string.
   */
  async encode(addresses) {
    return this.params.selector + ethers.utils.defaultAbiCoder.encode(["address[]"], [[addresses]]).substring(2)
  }

  /**
   * Update global reserves through
   * this method
   * @param {*} data - global reserves
   * @returns {Fetcher}
   */
  setGlobalReservesData(data) {
    this.globalReservesData = data
    this.emit("fetcherReady", {})
    return this
  }

  /**
   * Release current and get new provider
   */
  resetProvider() {
    this.provider = getProvider()
  }

  /**
   * Get current RPC provider
   * @returns {Provider} - provider from @npm/ethers
   */
  getProvider() {
    return this.provider
  }

  /**
   * some actions after created Fetcher instance
   */
  async init() {}
}

module.exports = { Fetcher }
