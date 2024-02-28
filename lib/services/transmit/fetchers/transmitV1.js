const { TransmitFetcherAave } = require("./aaveTransmitFetcher")
const { getHelper } = require("../../../helpers/onchain-aggr-V1")
const { PROTOCOLS_CONFIG } = require("../../../constants")

class TransmitV1 extends TransmitFetcherAave {
    /**
     * @param {*} settings - object that contains
     * services settings
     */
    constructor(settings, config) {
        super(settings, config)
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
        return [
            "uint256 totalLiquidityETH",
            "uint256 totalCollateralETH",
            "uint256 totalBorrowsETH",
            "uint256 totalFeesETH",
            "uint256 availableBorrowsETH",
            "uint256 currentLiquidationThreshold",
            "uint256 ltv",
            "uint256 healthFactor",
        ]
    }

    getDataPrefix() {
        return "0xbf92857c000000000000000000000000"
    }
}

module.exports = { TransmitV1 }
