"use strict"
const { FetcherAave } = require("./aave-fetcher")
const { getHelper } = require("../../../helpers/onchain-aggr-V1")
const { Contract } = require("ethers")
const { PROTOCOLS_CONFIG } = require("../../../constants")
const CONTROLLER_ABI = require("../../../artifacts/compound/ControllerABI")

/**
 * FetcherCompound user data fetcher
 */
class FetcherCompound extends FetcherAave {
  /**
   * @param {*} settings - object that contains
   * services settings
   * @param {*} config - config object with all settings variables
   */
  constructor(settings, config) {
    super(settings)
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

  getAssets(rawAssets) {
    return rawAssets.map(asset => this.globalReservesData[asset].underlying)
  }

  async calculateHealthFactor(healthFactor, user, provider) {
    const controllerAddress = PROTOCOLS_CONFIG.Compound.CONTROLLER
    const constrollerInstance = new Contract(controllerAddress, CONTROLLER_ABI, provider)
    const liquidateData = await constrollerInstance.getAccountLiquidity(user)

    return Number(liquidateData[1]) == 0 ? 0.99 : healthFactor / 10 ** 18
  }
}

module.exports = { FetcherCompound }
