const { Fetcher } = require("./fetcher")
const { Contract } = require("ethers")

const { getHelper } = require("../../../helpers/onchain-aggr-V1")

/* Pool contract */
const V1LendingPoolABI = require("../../../artifacts/v1/LendingPoolABI")
const { PROTOCOLS_CONFIG } = require("../../../constants")

/**
 * @param {string} protocol - The protocol of the protocol ('V1', 'V2', 'V3' or 'Compound')
 * @param {*} filters - object that contains { minHF, maxHF, minBorrow ...}
 * @param {*} config -Main.json
 */
class FetcherV1 extends Fetcher {
  constructor(protocol, filters, config) {
    super(protocol, filters, config)

    this.helperContract = getHelper(this.protocol, this.provider, config)
    this.contract = new Contract(PROTOCOLS_CONFIG.V1.POOL, V1LendingPoolABI, this.provider)
  }
}

module.exports = { FetcherV1 }
