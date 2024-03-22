const { Contract } = require("ethers")
const { Fetcher } = require("./fetcher")
const liquityControllerAbi = require("../../../artifacts/liquity/ControllerABI")
const { PROTOCOLS_CONFIG } = require("../../../constants")

class FetcherLiquity extends Fetcher {
  constructor(protocol) {
    super(protocol)

    this.pool = new Contract(PROTOCOLS_CONFIG.Liquity.CONTROLLER, liquityControllerAbi, this.provider)
  }

  async start(latestDbBlock, latestBlock) {
    this.inProgress = true
    const fromBlock = latestDbBlock || PROTOCOLS_CONFIG.Liquity.CREATED_AT_BLOCK
    const eventFilter = this.pool.filters.TroveCreated()

    this.iterateBlocksByRange(10_000, fromBlock, latestBlock, async (fromBlock, toBlock) => {
      const events = await this.pool.queryFilter(eventFilter, fromBlock, toBlock)
      const users = events.map((event) => event.args._borrower)

      this.emitEvent({ users, toBlock })
      this.emitAllDataProcessed(toBlock, latestBlock)
    })
  }
}

module.exports = {
  FetcherLiquity,
}
