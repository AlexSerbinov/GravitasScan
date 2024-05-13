const { BigNumber } = require("ethers")
const { Fetcher } = require("./fetcher")

/* Helper contract */
const { getHelper } = require("../../../helpers/onchain-aggr-V1")

/**
 * @param {string} protocol - The protocol of the protocol ('V1', 'V2', 'V3' or 'Compound')
 * @param {*} filters - object that contains { minHF, maxHF, minBorrow ...}
 * @param {*} config -Main.json
 */
class FetcherCompound extends Fetcher {
  constructor(protocol, filters, config) {
    super(protocol, filters, config)

    this.helperContract = getHelper(this.protocol, this.provider, config)
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
