const { BigNumber } = require("ethers")
const { Fetcher } = require("./fetcher")

/* Helper contract */
const { getHelper } = require("../../../helpers/onchain-aggr-V1")

class FetcherCompound extends Fetcher {
  constructor(protocol, settings, config) {
    super(protocol, settings, config)
    this.config = config

    this.helperContract = getHelper(this.protocol, this.provider, this.config)
    this.contract = null
  }

  async getUserData(address, blockTag) {
    const { healthFactor, totalCollateralETH, totalBorrowsETH } = await this.helperContract.getUserReserves(address)

    return {
      healthFactor,
      totalCollateralETH,
      totalBorrowsETH,
    }
  }

  /**
   * Update global reserves through
   * this method
   * @param {*} data - global reserves
   * @returns {Fetcher}
   */
  setGlobalReservesData(data) {
    this.globalReservesData = data
    this.helperContract.setGlobalReserves(data)
    this.emit("fetcherReady", {})
    return this
  }
}

module.exports = { FetcherCompound }
