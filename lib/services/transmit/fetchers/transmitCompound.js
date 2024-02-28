const { TransmitFetcherAave } = require("./aaveTransmitFetcher")
const { getHelper } = require("../../../helpers/onchain-aggr-V1")
const { PROTOCOLS_CONFIG } = require("../../../constants")

class TransmitCompound extends TransmitFetcherAave {
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
