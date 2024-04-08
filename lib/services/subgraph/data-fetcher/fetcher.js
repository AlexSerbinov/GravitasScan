const { EventEmitter } = require("node:events")
const { getProvider } = require("../../../ethers/pool")
const { BigNumber } = require("bignumber.js")
const { ethers } = require("ethers")

class Fetcher extends EventEmitter {
  constructor(params, settings, config, simulator) {
    super()
    if (new.target === Fetcher) {
      throw new TypeError("Cannot construct Fetcher instances directly")
    }

    const provider = getProvider()

    provider.on("error", e => this.resetProvider())

    this.settings = settings
    this.config = config
    this.params = params

    this.provider = provider
    this.blockNumber = null
    this.blockTimestamp = null

    this.globalReservesData = null
    this.simulator = simulator
  }

  /**
   * Getting user total debt and collateral
   * @param {string} address
   * @param {string} blockTag
   * @returns {Promise<{healthFactor: number, totalCollateralETH: number, totalBorrowsETH: number}>}
   */

  async getUsersData(addresses, blockTag, blockTimestamp) {
    const resp = await this.prepareTransaction(addresses, blockTag, blockTimestamp)
    // if (resp[0].user) console.log(`usersData success received from simulator`)
    // else console.log(`usersData failed to receive from simulator`)
    return resp
  }

  /**
   * Main function to analyze healthFactor, debt and collateral for users
   * @param {object} options
   * @param {object} user addresses - users addresses.
   * @param {string} [options.blockTag="latest"]
   * @returns {Promise<Array<{}>>} - filtered list of users
   */

  async loadUsersReserves({ addresses, blockTag, blockTimestamp }) {
    const { min_health_factor, max_health_factor, min_borrow_amount, min_collateral_amount } = this.settings

    const minCollateralAmount = min_collateral_amount * 10 ** 18
    const minBorrowAmount = min_borrow_amount * 10 ** 18

    const usersData = await this.getUsersData(addresses, blockTag, blockTimestamp)

    const filteredUsers = []

    for (const userData of usersData) {
      try {
        const { user, healthFactor, totalCollateralETH, totalBorrowsETH } = userData

        const calcHealthFactor = healthFactor / 10 ** 18

        if (calcHealthFactor < min_health_factor || calcHealthFactor > max_health_factor) {
          continue
        }

        const totalCollateralETHB = new BigNumber(totalCollateralETH.toString())
        const totalBorrowsETHB = new BigNumber(totalBorrowsETH.toString())
        if (totalCollateralETHB.gt(minCollateralAmount) && totalBorrowsETHB.gt(minBorrowAmount)) {
          filteredUsers.push({ user })
        }
      } catch (e) {
        console.error(`Error - loadUsersReserves for address ${userData.user} - ${e}`)
      }
    }
    // console.log(filteredUsers)
    return filteredUsers
  }

  /**
   * Get timestamp for latest block
   * @param {Provider} provider - Provider from @ethers
   * @returns {number} latest block timestamp
   */
  async getLatestTimestamp() {
    const block = await this.provider.getBlock("latest")
    const { timestamp } = block
    return timestamp
  }

  /**
   * Fetch user reserves data
   * and make decision what to do next:
   *
   * - Send to searcher
   * - Skip
   *
   * @param {{object}} usersData - users addresses
   */
  async fetchSubgraphUsers(usersData) {
    this.blockNumber = await this.provider.getBlockNumber()
    this.blockTimestamp = await this.getLatestTimestamp()
    if (!this.blockNumber) this.emit("error", "this.provider.getBlockNumber() failed")

    const filteredUsers = await this.loadUsersReserves({
      addresses: usersData,
      blockTag: this.blockNumber,
      blockTimestamp: this.blockTimestamp,
    })

    filteredUsers.forEach(filteredUser => {
      const { user, error } = filteredUser
      if (user && !error) {
        console.log(`this.emit "fetch"`)
        console.log(filteredUser)

        this.emit("fetch", filteredUser)
      }
      if (user && error) {
        this.emit("error", filteredUser)
      }
    })
  }

  /**
   * Prepares and simulates a transaction, then formats the result.
   * @param {Array} addresses - The addresses involved in the transaction.
   * @param {number} blockTag - The block number to execute the transaction.
   * @param {number} blockTimestamp - The timestamp of the block.
   * @returns {object} Formatted simulation result.
   */
  async prepareTransaction(addresses, blockTag, blockTimestamp) {
    const transaction = await this.createTransaction(addresses, blockTag)
    const simulationResult = await this.simulateTransaction(transaction, blockTag, blockTimestamp)
    return this.formatSimulationResult(simulationResult)
  }

  /**
   * Creates a transaction object with the given parameters.
   * @param {Array} addresses - The addresses to include in the transaction.
   * @param {number} blockTag - The block number to execute the transaction.
   * @returns {object} The transaction object.
   */
  async createTransaction(addresses, blockTag) {
    return {
      id: 1,
      chainId: 1,
      from: "0xa83114A443dA1CecEFC50368531cACE9F37fCCcb",
      to: this.params.simulationContract,
      gasLimit: 300000000000000000,
      data: await this.encode(addresses),
      blockNumber: blockTag,
      stateOverrides: this.params.stateOverrides.code,
      formatTrace: true,
    }
  }

  /**
   * Simulates a transaction and returns the result.
   * @param {object} transaction - The transaction to simulate.
   * @param {number} blockTag - The block number to simulate the transaction.
   * @param {number} blockTimestamp - The timestamp of the block.
   * @returns {object} The result of the simulation.
   */
  async simulateTransaction(transaction, blockTag, blockTimestamp) {
    const bundle = [transaction]
    await this.simulator.simulate(bundle, blockTag, blockTimestamp) //TODO @AlexSerbinov -- fix (no need to double action)
    return await this.simulator.simulate(bundle, blockTag, blockTimestamp)
  }

  /**
   * Formats the raw simulation result into a more readable form.
   * @param {object} simulationResult - The raw simulation result.
   * @returns {Array} Formatted simulation results.
   */
  async formatSimulationResult(simulationResult) {
    try {
      const returnData = simulationResult.get(1).returnData
      const decodedData = ethers.AbiCoder.defaultAbiCoder().decode(
        ["tuple(address user,uint256 totalCollateralETH,uint256 totalBorrowsETH,uint256 healthFactor)[]"],
        returnData
      )

      return decodedData[0].map(data => ({
        user: data.user,
        totalCollateralETH: data.totalCollateralETH.toString(),
        totalBorrowsETH: data.totalBorrowsETH.toString(),
        healthFactor: data.healthFactor.toString(),
      }))
    } catch (error) {
      console.error("Error in formatSimulationResult:", error)
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
    return this.params.selector + ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [addresses]).substring(2)
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
   * Reset current and get new provider
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
