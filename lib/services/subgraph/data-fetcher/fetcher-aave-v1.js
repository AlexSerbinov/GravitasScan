const { Fetcher } = require("./fetcher")
const { Contract } = require("ethers")

const { getHelper } = require("../../../helpers/onchain-aggr-V1")

/* Pool contract */
const V1LendingPoolABI = require("../../../artifacts/v1/LendingPoolABI")
const { PROTOCOLS_CONFIG } = require("../../../constants")

class FetcherV1 extends Fetcher {
  constructor(params, settings, config, simulator) {
    super(params, settings, config, simulator)
    this.config = config
    this.simulator = simulator

    this.params = params
    this.helperContract = getHelper(this.params.protocol, this.provider, this.config)
    this.contract = new Contract(PROTOCOLS_CONFIG.V1.POOL, V1LendingPoolABI, this.provider)
  }
}


module.exports = { FetcherV1 }
