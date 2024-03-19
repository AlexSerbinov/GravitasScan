const { EventEmitter } = require("node:events")
const { getProvider } = require("../../../ethers/pool")
const { BigNumber } = require("bignumber.js")

class Fetcher extends EventEmitter {
  constructor(protocol, settings) {
    super()
    if (new.target === Fetcher) {
      throw new TypeError("Cannot construct Fetcher instances directly")
    }

    const provider = getProvider()
    provider.on("error", e => this.resetProvider())

    this.settings = settings
    this.protocol = protocol
    this.provider = provider

    this.helperContract = null
    this.contract = null
    this.globalReservesData = null
  }

  // TODO rewrite it in future, because it wail operate by arrays
  /**
   * Getting user total debt and collateral
   * @param {string} address
   * @param {string} blockTag
   * @returns {Promise<{healthFactor: number, totalCollateralETH: number, totalBorrowsETH: number}>}
   */
  async getUsersData(address, blockTag) {
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
   * Main function to analyze healthFactor, debt and collateral for users
   * @param {object} options
   * @param {object} user addresses - users addresses.
   * @param {string} [options.blockTag="latest"]
   * @returns {Promise<Array<{}>>} - filtered list of users
   */
  async loadUsersReserves({ addresses, blockTag = "latest" }) {
    const { min_health_factor, max_health_factor, min_borrow_amount, min_collateral_amount } = this.settings

    const minCollateralAmount = min_collateral_amount * 10 ** 18
    const minBorrowAmount = min_borrow_amount * 10 ** 18

    const usersData = await this.getUsersData(addresses, blockTag)

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
    console.log(`======================= filteredUsers 1 ===================`)
    console.log(filteredUsers)
    console.log(`======================= filteredUsers 2 ===================`)
    return filteredUsers
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
    const filteredUsers = await this.loadUsersReserves({
      addresses: usersData,
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
