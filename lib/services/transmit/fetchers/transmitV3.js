const { TransmitFetcherAave } = require("./aave-transmitFetcher")
const { getHelper } = require("../../../helpers/onchain-aggr-V1")
const { PROTOCOLS_CONFIG } = require("../../../constants")

class TransmitV3 extends TransmitFetcherAave {
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

    getProtocol() {
        return "V3"
    }

    getLendingPool() {
        return PROTOCOLS_CONFIG.V3.POOL
    }

    getABIDecode() {
        return [
            "uint256 totalCollateralBase",
            "uint256 totalDebtBase",
            "uint256 availableBorrowsBase",
            "uint256 currentLiquidationThreshold",
            "uint256 ltv",
            "uint256 healthFactor",
        ]
    }

    getDataPrefix() {
        return "0xbf92857c000000000000000000000000"
    }
}
module.exports = { TransmitV3 }
