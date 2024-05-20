"use strict"
const { FetcherAave } = require("./aave-fetcher")
const { getHelper } = require("../../../helpers/onchain-aggr-V1")

/**
 * V1 user data fetcher
 */
class FetcherV1 extends FetcherAave {
  /**
   * @param {*} filters - object that contains { minHF, maxHF, minBorrow ...}
   * @param {*} config - Main.json
   * @param {*} params - params object from [protocol]filters.json param field
   */
  constructor(filters, config, params, simulator) {
    super(filters, config, params, simulator)
    this.config = config
    this.params = params
  }

  /**
   * Gett aave helper contract
   * @param {Provider} - rpc provider
   * @returns {Helper}
   */
  getContract(provider) {
    return getHelper("V1", provider, this.config)
  }
}

module.exports = { FetcherV1 }
