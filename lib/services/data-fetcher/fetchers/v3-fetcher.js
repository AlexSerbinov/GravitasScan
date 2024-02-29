"use strict"
const { FetcherAave } = require("./aave-fetcher")
const { getHelper } = require("../../..//helpers/onchain-aggr-V1")

/**
 * V3 user data fetcher
 */
class FetcherV3 extends FetcherAave {
    /**
     * @param {*} settings - object that contains
     * services settings
     */
    constructor(settings) {
        super(settings)
    }

    /**
     * Gett aave helper contract
     * @param {Provider} - rpc provider
     * @returns {Helper}
     */
    getContract(provider) {
        return getHelper("V3", provider)
    }

    async calculateHealthFactor(healthFactor, user, provider) {
        return healthFactor / 10 ** 18
    }
}

module.exports = { FetcherV3 }
