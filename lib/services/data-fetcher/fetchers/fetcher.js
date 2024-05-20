"use ctrict"
const { EventEmitter } = require("node:events")
const { ethers } = require("ethers")
const { SIMULATION_RESULT, SIMULATION_ERROR } = require("../../../../configs/eventTopicsConstants")

/**
 * Abstract fetcher
 *
 * To request user data
 */
class Fetcher extends EventEmitter {
  /**
   * @param {*} filters - object that contains { minHF, maxHF, minBorrow ...}
   * @param {*} config - Main.json
   * @param {*} params - params object from [protocol]filters.json param field
   */
  constructor(filters, config, params, simulator) {
    super()
    this.filters = filters
    this.config = config
    this.params = params
    this.simulator = simulator
    this.globalReservesData = null
    this.wallet = new ethers.Wallet(this.config.HELPER_OWNER_PRIVATE_KEY)
  }

  /**
   * Update global reserves through
   * this method
   * @param {*} data - global reserves
   * @returns {Fetcher}
   */
  setGlobalReservesData(data) {
    this.globalReservesData = data
    return this
  }

  /**
   * Fetch user reserves data
   * and make decision what to do next:
   *
   * - Liquidate
   * - Watch longer
   * - Forget
   *
   * @param {string} user - user address
   */
  async fetchData({ user }) {
    if (!this.globalReservesData) {
      return
    }
    if (!user || typeof user !== "string") {
      this.emit("reject", user)
      return
    }

    const resp = await this.filterUserByLiquidationFilters(user).catch(error => {
      this.emit("error", { error, user })
    })

    const { del, liq, watch } = resp
    if (del) this.emit("deleteFromRedis", resp)
    if (liq) this.emit("liquidate", resp)
    if (watch) this.emit("pushToRedis", resp)
  }

  /**
   * Implement execution in the child class
   */
  filterUserByLiquidationFilters() {
    throw new Error("Method not implemented.")
  }

  /**
   * Getting user total debt and collateral
   * @param {string} address
   * @returns {Promise<{healthFactor: number, totalCollateralETH: number, totalBorrowsETH: number}>}
   */
  // getUserData erlier
  async getUserReserves(address) {
    try {
      const resp = await this.prepareAndSimulateTransaction(address)
      if (resp.user && resp.user != 0x0) {
        const message = `Simulation SUCCESS` // TODO delete
        console.log(message)
        this.emit("info", message, SIMULATION_RESULT)
      } else {
        const message = `Simulation FAILLED.`
        console.log(message)
        this.emit("info", message, SIMULATION_ERROR)
      }
      return resp
    } catch (error) {
      // console.error(`simulation error: ${error.message}`)
      console.error(error)
      throw error
    }
  }

  /**
   * Prepares and simulates a transaction, then formats the result.
   * @param {Array} address - The address involved in the transaction.
   * @returns {object} ted simulation result.
   */
  async prepareAndSimulateTransaction(address) {
    try {
      const transaction = await this.createTransaction(address)
      const simulationResult = await this.simulateTransaction(transaction)
      return this.formatSimulationResult(simulationResult)
    } catch (error) {
      throw error
    }
  }

  /**
   * Creates a transaction object with the given parameters.
   * @param {Array} address - The address to include in the transaction.
   * @returns {object} The transaction object.
   */
  async createTransaction(address) {
    const stateOverrideKey = Object.keys(this.params.stateOverrides)[0]
    const stateOverrideCode = this.params.stateOverrides[stateOverrideKey].code
    return {
      id: 1,
      chainId: 1,
      from: this.wallet.address,
      to: this.params.simulationContract,
      gasLimit: 300000000000000000,
      data: await this.encode(address),
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
      if (!simulationResult || simulationResult.size === 0) {
        throw new Error("Invalid or empty simulationResult")
      }

      const returnData = simulationResult.get(1)?.returnData
      if (!returnData) {
        throw new Error("Return data not found")
      }

      const decodedData = ethers.utils.defaultAbiCoder.decode(["tuple(tuple(address user,uint256 totalCollateralETH,uint256 totalBorrowsETH,uint256 healthFactor) userData,tuple(address asset,uint256 collateralBalance,uint256 borrowBalance)[] reserves)[]"], returnData)

      const userData = decodedData?.[0]?.[0]?.userData
      const reserves = decodedData?.[0]?.[0]?.reserves || []

      if (!userData) {
        throw new Error("User data not found")
      }

      const { user, totalCollateralETH, totalBorrowsETH, healthFactor } = userData

      const formattedData = {
        user: user || ethers.constants.AddressZero,
        totalCollateralETH: totalCollateralETH?.toString() || "0",
        totalBorrowsETH: totalBorrowsETH?.toString() || "0",
        healthFactor: healthFactor?.toString() || "0",
        reserves: reserves.map(({ asset, collateralBalance, borrowBalance }) => ({
          asset: asset || ethers.constants.AddressZero,
          collateralBalance: collateralBalance?.toString() || "0",
          borrowBalance: borrowBalance?.toString() || "0",
        })),
      }

      return formattedData
    } catch (error) {
      console.error("Error formatting simulation result:", error)
      return {
        user: ethers.constants.AddressZero,
        totalCollateralETH: "0",
        totalBorrowsETH: "0",
        healthFactor: "0",
        reserves: [],
      }
    }
  }

  /**
   * Encodes the address into a single data string using the contract's ABI.
   * @param {Array} address - The address to encode.
   * @returns {string} The encoded data string.
   */
  async encode(address) {
    return this.params.selector + ethers.utils.defaultAbiCoder.encode(["address[]"], [[address]]).substring(2)
  }
}

module.exports = { Fetcher }
