const { Fetcher } = require("./fetcher")
const { Contract, BigNumber } = require("ethers")
const ETH_USD_PriceFeedABI = require("../../../artifacts/oracle/ETH-USD-PriceFeedABI")
const TroveManagerABI = require("../../../artifacts/liquity/TroveManagerABI")
const { PROTOCOLS_CONFIG, ETH_USD_ORACLE } = require("../../../constants")

class FetcherLiquity extends Fetcher {
  constructor(params, settings, config, simulator) {
    super(params, settings, config, simulator)

    this.eth_usd_oracle_contract = new Contract(ETH_USD_ORACLE, ETH_USD_PriceFeedABI, this.provider)
    this.troveManagerContract = new Contract(PROTOCOLS_CONFIG.Liquity.TROVE_MANAGER, TroveManagerABI, this.provider)
  }

  /**
   * Getting user total debt and collateral
   * @param {string} address
   * @param {string} blockTag
   * @returns {Promise<{healthFactor: number, totalCollateralETH: number, totalBorrowsETH: number}>}
   */
  async getUsersData(address, blockTag) {
    const { coll, debt } = await this.troveManagerContract.Troves(address, {
      blockTag,
    })

    const { price, decimals } = this.globalReservesData["eth"]
    const ethPrice = BigNumber.from(price) / 10 ** decimals

    const totalCollateralETH = coll / 1
    const totalBorrowsETH = debt / ethPrice

    /**
     * !!!min hf = 110%
     */
    const healthFactor = totalBorrowsETH !== 0 ? totalCollateralETH / totalBorrowsETH : 0

    return {
      healthFactor: healthFactor * 10 ** 18,
      totalCollateralETH: totalCollateralETH,
      totalBorrowsETH: totalBorrowsETH,
    }
  }
}

module.exports = {
  FetcherLiquity,
}
