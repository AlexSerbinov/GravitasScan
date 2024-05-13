const { EventEmitter } = require("node:events")
const { getProvider } = require("../../../ethers/pool")
const { BigNumber } = require("bignumber.js")

/**
 * @param {string} protocol - The protocol of the protocol ('V1', 'V2', 'V3' or 'Compound')
 * @param {*} filters - object that contains { minHF, maxHF, minBorrow ...}
 * @param {*} config -Main.json
 */
class Fetcher extends EventEmitter {
  constructor(protocol, filters, config) {
    super()
    if (new.target === Fetcher) {
      throw new TypeError("Cannot construct Fetcher instances directly")
    }

    const provider = getProvider()
    provider.on("error", e => this.resetProvider())

    this.filters = filters
    this.protocol = protocol
    this.provider = provider

    this.helperContract = null
    this.contract = null
    this.globalReservesData = null
  }

  /**
   * Getting user total debt and collateral
   * @param {string} address
   * @param {string} blockTag
   * @returns {Promise<{healthFactor: number, totalCollateralETH: number, totalBorrowsETH: number}>}
   */
  async getUserData(address, blockTag) {
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
   * Main function to analyze healthFactor, debt and collateral for user
   * @param {object} options
   * @param {string} options.address - user address.
   * @param {string} [options.blockTag="latest"]
   * @returns {Promise<{}>} - filtered list of users
   */
  async loadUserReserves({ address, blockTag = "latest" }) {
    const { min_health_factor, min_borrow_amount, min_collateral_amount } = this.filters

    const minBorrowAmount = min_borrow_amount * 10 ** 18
    const minCollateralAmount = min_collateral_amount * 10 ** 18

    try {
      const { healthFactor, totalCollateralETH, totalBorrowsETH } = await this.getUserData(address, blockTag)

      const calcHealthFactor = healthFactor / 10 ** 18
      const totalCollateralETHB = new BigNumber(totalCollateralETH.toString())
      const totalBorrowsETHB = new BigNumber(totalBorrowsETH.toString())
      //check healthFactor
      if (calcHealthFactor <= min_health_factor || totalCollateralETHB.lte(minBorrowAmount) || totalBorrowsETHB.lte(minCollateralAmount)) {
        return { user: address, add: true }
      }

      return { user: address, add: false }

      //skip
    } catch (e) {
      //skip
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
