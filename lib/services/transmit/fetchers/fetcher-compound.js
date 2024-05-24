const { TransmitFetcherAave } = require("./fetcher-aave")
const { getHelper } = require("../../../helpers/onchain-aggregator")
const { PROTOCOLS_CONFIG } = require("../../../constants")

class TransmitCompound extends TransmitFetcherAave {
  /**
   * @param {*} filters - object that contains
   * services filters
   * @param {number} maxNumberOfUsersToSimulate - The maximum number of users for parallel simulation.
   * @param {*} config - config object with all filters variables
   * @param {*} simulator - Interface for enso simulator
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
    const helper = getHelper("Compound", provider, this.config)
    helper.setGlobalReserves(this.globalReservesData)
    return helper
  }

  getProtocol() {
    return "Compound"
  }

  getLendingPool() {
    return PROTOCOLS_CONFIG.Compound.CONTROLLER
  }

  getABIDecode() {
    return ["uint256", "uint256 CanLiquidate", "uint256 Liquidate"]
  }

  getDataPrefix() {
    return "0x5ec88c79000000000000000000000000"
  }
}
module.exports = { TransmitCompound }
