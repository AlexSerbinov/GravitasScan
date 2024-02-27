const { TransmitFetcherAave } = require("./aave-transmitFetcher")
const { getHelper } = require('../../../helpers/aave-сompound-helper')
const { PROTOCOLS_CONFIG } = require("../../../constants")

class TransmitV2 extends TransmitFetcherAave {

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
        return getHelper('V2', provider)
    }

    getProtocol() {
        return "V2"
    }

    getLendingPool() {
        return PROTOCOLS_CONFIG.V2.POOL
    }

    getABIDecode() {
        return ['uint256 totalCollateralETH', 'uint256 totalDebtETH', 'uint256 availableBorrowsETH', 'uint256 currentLiquidationThreshold', 'uint256 ltv', 'uint256 healthFactor']
    }


    getDataPrefix() {
        return "0xbf92857c000000000000000000000000"
    }
}
module.exports = { TransmitV2 }
