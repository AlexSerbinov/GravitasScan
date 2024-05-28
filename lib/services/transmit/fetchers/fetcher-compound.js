const { TransmitFetcherAave } = require("./fetcher-aave")
const { getHelper } = require("../../../helpers/onchain-aggregator")
const { PROTOCOLS_CONFIG } = require("../../../constants")

class TransmitCompound extends TransmitFetcherAave {
  /**
   * @param {*} params -  object that contains all params from $.params
   * @param {*} filters - object that contains { minHF, maxHF }
   * @param {*} config - all configs from Main.json
   * @param {*} simulator - Simulator instance
   */
  constructor(params, filters, config, simulator) {
    super(params, filters, config, simulator)
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
