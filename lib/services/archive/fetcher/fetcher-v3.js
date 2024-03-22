const { Contract } = require("ethers")
const { Fetcher } = require("./fetcher")
const V3LendingPoolABI = require("../../../artifacts/v3/PoolDataArchiveABI")
const { PROTOCOLS_CONFIG } = require("../../../constants")

class FetcherV3 extends Fetcher {
  constructor(protocol) {
    super(protocol)

    this.pool = new Contract(PROTOCOLS_CONFIG.V3.POOL, V3LendingPoolABI, this.provider)
  }

  async start(latestDbBlock, latestBlock) {
    this.inProgress = true
    const fromBlock = latestDbBlock || PROTOCOLS_CONFIG.V3.CREATED_AT_BLOCK
    const eventFilter = this.pool.filters.Borrow()

    this.iterateBlocksByRange(10_000, fromBlock, latestBlock, async (fromBlock, toBlock) => {
      const events = await this.pool.queryFilter(eventFilter, fromBlock, toBlock)
      const users = events.reduce((acc, event) => {
        const userAddresses = this.handleUsers(event.args)
        return [...acc, ...userAddresses]
      }, [])

      this.emitEvent({ users, toBlock })
      this.emitAllDataProcessed(toBlock, latestBlock)
    })
  }
}

module.exports = {
  FetcherV3,
}
