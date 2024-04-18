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
    this.wallet = new ethers.Wallet(this.config.HELPER_OWNER_PRIVATE_KEY)

    this.provider = provider
    this.blockNumber = null
    this.blockTimestamp = null

    this.globalReservesData = null
    this.simulator = simulator
    this.counter = 0
  }

  /**
   * Getting user total debt and collateral
   * @param {string} address
   * @param {string} blockTag
   * @returns {Promise<{healthFactor: number, totalCollateralETH: number, totalBorrowsETH: number}>}
   */

  async getUsersData(addresses, blockTag, blockTimestamp) {
    try {
      const resp = await this.prepareAndSimulateTransaction(addresses, blockTag, blockTimestamp)
      if (resp[0].user && resp[0].user != 0x0) {
        const skipCount = 1
        if (this.counter === skipCount) {
          // we sent only 1 from 10 events, to not spam the logs
          const message = `Simulation SUCCESS. Note: showed only 1/${skipCount} simulation results.`
          this.emit("info", message, "simulation_result")
          this.counter = 0
        }
        this.counter++
      } else {
        const message = `Simulation FAILLED.`
        console.log(message)
        this.emit("info", message)
      }
      return resp
    } catch (error) {
      console.error(`simulation error: ${error.message}`)
      console.error(error)
      throw error
    }
  }

  /**
   * Main function to analyze healthFactor, debt and collateral for users
   * @param {object} options
   * @param {object} user addresses - users addresses.
   * @param {string} [options.blockTag="latest"]
   * @returns {Promise<Array<{}>>} - filtered list of users
   */

  async loadUsersReserves({ addresses, blockTag, blockTimestamp }) {
    try {
      const { min_health_factor, max_health_factor, min_borrow_amount, min_collateral_amount } = this.settings

      const minCollateralAmount = min_collateral_amount * 10 ** 18
      const minBorrowAmount = min_borrow_amount * 10 ** 18

      const usersData = await this.getUsersData(addresses, blockTag, blockTimestamp)

      const filteredUsers = []
      const scippedUsers = []

      for (const userData of usersData) {
        try {
          // This if only for reduce logs purpose
          if (filteredUsers.length + scippedUsers.length == usersData.length - 1) {
            const scippedUserAddresses = scippedUsers.map(user => user.user)
            this.emit("info", `users was skipped, because filtered params are to different: ${scippedUserAddresses.join(", ")}`, "user_skipped_by_filters")
          }
          const { user, healthFactor, totalCollateralETH, totalBorrowsETH } = userData

          const calcHealthFactor = healthFactor / 10 ** 18

          if (calcHealthFactor < min_health_factor) {
            scippedUsers.push({ user })
            if (calcHealthFactor > min_health_factor * 0.7) {
              // This if only for reduce logs purpose
              this.emit("info", `user: ${user} [skipped] | HF: ${calcHealthFactor} , minHF: ${min_health_factor}`, "user_skipped_by_filters")
            }
            continue
          }
          if (calcHealthFactor > max_health_factor) {
            scippedUsers.push({ user })
            if (calcHealthFactor < max_health_factor * 1.3) {
              // This if only for reduce logs purpose
              this.emit("info", `user: ${user} [skipped] | HF: ${calcHealthFactor} , maxHF: ${max_health_factor}`, "user_skipped_by_filters")
            }
            continue
          }

          const totalCollateralETHB = new BigNumber(totalCollateralETH.toString())
          const totalBorrowsETHB = new BigNumber(totalBorrowsETH.toString())
          if (totalCollateralETHB.lt(minCollateralAmount)) {
            scippedUsers.push({ user })
            if (totalCollateralETHB.gt(minCollateralAmount * 0.5)) {
              // This if only for reduce logs purpose
              this.emit("info", `user: ${user} [skipped] | totalCollateralETH: ${totalCollateralETHB / 10 ** 18}, minCollateral: ${minCollateralAmount / 10 ** 18}`, "user_skipped_by_filters")
            }
            continue
          }

          if (totalBorrowsETHB.lt(minBorrowAmount)) {
            scippedUsers.push({ user })
            if (totalBorrowsETHB.gt(minBorrowAmount * 0.5)) {
              // This if only for reduce logs purpose
              this.emit("info", `user: ${user} [skipped] | totalBorrowsETH: ${totalBorrowsETHB / 10 ** 18}, maxBorrow: ${minBorrowAmount / 10 ** 18}`, "user_skipped_by_filters")
            }
            continue
          }
          filteredUsers.push({ user })
          this.emit("info", `user: ${user}, HF: ${calcHealthFactor}, totalCollateralETH: ${totalCollateralETHB / 10 ** 18}, totalBorrowsETH: ${totalBorrowsETHB / 10 ** 18}`, "user_liquidation_params_passed")
        } catch (e) {
          console.error(`Error - loadUsersReserves for address ${userData.user} - ${e}`)
          this.emit("error", `Error - loadUsersReserves for address ${userData.user} - ${e}`)
        }
      }
      return filteredUsers
    } catch {}
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
    try {
      this.blockNumber = await this.provider.getBlockNumber()
      this.blockTimestamp = await this.getLatestTimestamp()
      if (!this.blockNumber) this.emit("errorMessage", "this.provider.getBlockNumber() failed", "provider error")

      const filteredUsers = await this.loadUsersReserves({
        addresses: usersData,
        blockTag: this.blockNumber,
        blockTimestamp: this.blockTimestamp,
      })

      filteredUsers.forEach(filteredUser => {
        const { user, error } = filteredUser
        if (user && !error) {
          const lowercaseUser = user.toLowerCase()
          this.emit("fetch", { user: lowercaseUser })
        }
        if (user && error) {
          this.emit("errorMessage", filteredUser)
        }
      })
    } catch {}
  }

  /**
   * Prepares and simulates a transaction, then formats the result.
   * @param {Array} addresses - The addresses involved in the transaction.
   * @param {number} blockTag - The block number to execute the transaction.
   * @param {number} blockTimestamp - The timestamp of the block.
   * @returns {object} ted simulation result.
   */
  async prepareAndSimulateTransaction(addresses, blockTag, blockTimestamp) {
    try {
      const transaction = await this.createTransaction(addresses, blockTag)
      const simulationResult = await this.simulateTransaction(transaction, blockTag, blockTimestamp)
      return this.formatSimulationResult(simulationResult)
    } catch (error) {
      throw error
    }
  }

  /**
   * Creates a transaction object with the given parameters.
   * @param {Array} addresses - The addresses to include in the transaction.
   * @param {number} blockTag - The block number to execute the transaction.
   * @returns {object} The transaction object.
   */
  async createTransaction(addresses, blockTag) {
    const stateOverrideKey = Object.keys(this.params.stateOverrides)[0]
    const stateOverrideCode = this.params.stateOverrides[stateOverrideKey].code

    return {
      id: 1,
      chainId: 1,
      from: this.wallet.address,
      to: this.params.simulationContract,
      gasLimit: 300000000000000000,
      data: await this.encode(addresses),
      blockNumber: blockTag,
      stateOverrides: stateOverrideCode,
      formattedTrace: false, // TODO get from params
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
    try {
      const bundle = [transaction]
      const resp = await this.simulator.simulate(bundle, blockTag, blockTimestamp)
      return resp
    } catch (error) {
      this.emit("errorMessage", error, "simulation error")
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
    return this.params.selector + ethers.utils.defaultAbiCoder.encode(["address[]"], [addresses]).substring(2)
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
