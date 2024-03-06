const { Fetcher } = require("./fetcher")
const { Contract } = require("ethers")

const { getHelper } = require("../../../helpers/onchain-aggr-V1")

/* Pool contract */
const V1LendingPoolABI = require("../../../artifacts/v1/LendingPoolABI")
const { PROTOCOLS_CONFIG } = require("../../../constants")

class FetcherV1 extends Fetcher {
  constructor(protocol, settings, config) {
    super(protocol, settings, config)
    this.config = config
    
    this.helperContract = getHelper(this.protocol, this.provider, this.config)
    this.contract = new Contract(PROTOCOLS_CONFIG.V1.POOL, V1LendingPoolABI, this.provider)
  }
}

module.exports = { FetcherV1 }
