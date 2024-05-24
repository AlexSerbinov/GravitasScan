const { TransmitFetcherAave } = require("./fetcher-aave")
const { getHelper } = require("../../../helpers/onchain-aggregator")
const { PROTOCOLS_CONFIG } = require("../../../constants")

class TransmitV1 extends TransmitFetcherAave {
  /**
   * @param {*} filters - object that contains
   * services filters
   * @param {number} maxNumberOfUsersToSimulate - The maximum number of users for parallel simulation.
   * @param {*} config - config object with all filters variables
   * @param {*} simulator - Interface for enso simulator
   *
   */
  constructor(filters, maxNumberOfUsersToSimulate, config, simulator) {
    super(filters, maxNumberOfUsersToSimulate, config, simulator)
    this.config = config
  }

  /**
   * Gett aave helper contract
   * @param {Provider} - rpc provider
   * @returns {Helper}
   */
  getContract(provider) {
    return getHelper("V1", provider, this.config)
  }

  getProtocol() {
    return "V1"
  }

  getLendingPool() {
    return PROTOCOLS_CONFIG.V1.POOL
  }

  getABIDecode() {
    return ["uint256 totalLiquidityETH", "uint256 totalCollateralETH", "uint256 totalBorrowsETH", "uint256 totalFeesETH", "uint256 availableBorrowsETH", "uint256 currentLiquidationThreshold", "uint256 ltv", "uint256 healthFactor"]
  }

  getDataPrefix() {
    return "0xbf92857c000000000000000000000000"
  }
}

module.exports = { TransmitV1 }
