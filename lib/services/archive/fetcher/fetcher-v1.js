const { Contract } = require("ethers")
const { Fetcher } = require("./fetcher")
const V1LendingPoolABI = require("../../../artifacts/v1/LendingPoolArchiveABI")
const { PROTOCOLS_CONFIG } = require("../../../constants")

class FetcherV1 extends Fetcher {
  constructor(protocol) {
    super(protocol)

    this.pool = new Contract(PROTOCOLS_CONFIG.V1.POOL, V1LendingPoolABI, this.provider)
  }

  async start(latestDbBlock, latestBlock) {
    this.inProgress = true
    const fromBlock = latestDbBlock || PROTOCOLS_CONFIG.V1.CREATED_AT_BLOCK
    const eventFilter = this.pool.filters.Borrow()

    this.iterateBlocksByRange(10_000, fromBlock, latestBlock, async (fromBlock, toBlock) => {
      const events = await this.pool.queryFilter(eventFilter, fromBlock, toBlock)
      const users = events.map((event) => event.args._user)

      this.emitEvent({ users, toBlock })
      this.emitAllDataProcessed(toBlock, latestBlock)
    })
  }
}

module.exports = {
  FetcherV1,
}
