const { Contract } = require("ethers")
const { Fetcher } = require("./fetcher")
const compoundControllerAbi = require("../../../artifacts/compound/ControllerABI")
const { PROTOCOLS_CONFIG } = require("../../../constants")

class FetcherCompound extends Fetcher {
  constructor(protocol) {
    super(protocol)

    this.pool = new Contract(PROTOCOLS_CONFIG.Compound.CONTROLLER, compoundControllerAbi, this.provider)
  }

  async start(latestDbBlock, latestBlock) {
    this.inProgress = true
    const fromBlock = latestDbBlock || PROTOCOLS_CONFIG.Compound.CREATED_AT_BLOCK
    const eventFilter = this.pool.filters.DistributedBorrowerComp()

    this.iterateBlocksByRange(10_000, fromBlock, latestBlock, async (fromBlock, toBlock) => {
      const events = await this.pool.queryFilter(eventFilter, fromBlock, toBlock)
      const users = events.map((event) => event.args.borrower)

      this.emitEvent({ users, toBlock })
      this.emitAllDataProcessed(toBlock, latestBlock)
    })
  }
}

module.exports = {
  FetcherCompound,
}
