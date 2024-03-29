const { Contract } = require("ethers")
const { Fetcher } = require("./fetcher")
const V2LendingPoolABI = require("../../../artifacts/v2/LendingPoolArchiveABI")
const { PROTOCOLS_CONFIG } = require("../../../constants")

class FetcherV2 extends Fetcher {
  constructor(protocol) {
    super(protocol)

    this.pool = new Contract(PROTOCOLS_CONFIG.V2.POOL, V2LendingPoolABI, this.provider)
  }

  async start(latestDbBlock, latestBlock) {
    this.inProgress = true
    const fromBlock = latestDbBlock || PROTOCOLS_CONFIG.V2.CREATED_AT_BLOCK
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
  FetcherV2,
}
