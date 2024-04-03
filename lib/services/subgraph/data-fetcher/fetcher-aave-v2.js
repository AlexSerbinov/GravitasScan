const { Fetcher } = require("./fetcher")
const { Contract } = require("ethers")

/* Helper contract */
const { getHelper } = require("../../../helpers/onchain-aggr-V1")

/* Pool contract */
const V2LendingPoolABI = require("../../../artifacts/v2/LendingPoolABI")
const { PROTOCOLS_CONFIG } = require("../../../constants")

class FetcherV2 extends Fetcher {
  constructor(params, settings, config, simulator) {
    super(params, settings, config, simulator) 
    this.config = config 
    this.simulator = simulator 

    this.params = params 
    this.helperContract = getHelper(this.params.protocol, this.provider, this.config)
    this.contract = new Contract(PROTOCOLS_CONFIG.V2.POOL, V2LendingPoolABI, this.provider)
  }
}

module.exports = { FetcherV2 }
