const { Fetcher } = require("./fetcher")
const { Contract } = require("ethers")

/* Helper contract */
const { getHelper } = require("../../../helpers/onchain-aggr-V1")

/* Pool contract */
const V2LendingPoolABI = require("../../../artifacts/v2/LendingPoolABI")
const { PROTOCOLS_CONFIG } = require("../../../constants")

class FetcherV2 extends Fetcher {
  constructor(params, settings, config, simulator) {
    super(params, settings, config, simulator) // TODO can be deleted?
    this.config = config // TODO can be deleted?
    this.simulator = simulator // TODO can be deleted?

    this.params = params // TODO can be deleted?
    this.helperContract = getHelper(this.params.protocol, this.provider, this.config) // TODO can be deleted
    this.contract = new Contract(PROTOCOLS_CONFIG.V2.POOL, V2LendingPoolABI, this.provider) // TODO can be deleted
  }
}

module.exports = { FetcherV2 }
