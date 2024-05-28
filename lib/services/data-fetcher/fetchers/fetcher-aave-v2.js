"use strict"
const { FetcherAave } = require("./fetcher-aave")
const { getHelper } = require("../../..//helpers/onchain-aggregator")

/**
 * V2 user data fetcher
 */
class FetcherV2 extends FetcherAave {
  /**
   * @param {*} filters - object that contains { minHF, maxHF, minBorrow ...}
   * @param {*} config - all configs settings from Main.json
   * @param {*} params - params object from [protocol]filters.json param field
   * @param {*} simulator - enso simulator instance
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
    return getHelper("V2", provider, this.config)
  }
}

module.exports = { FetcherV2 }
