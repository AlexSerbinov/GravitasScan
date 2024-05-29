const { Contract } = require("ethers")
const { Fetcher } = require("./fetcher")
const liquityControllerAbi = require("../../../artifacts/liquity/ControllerABI")
const { PROTOCOLS_CONFIG } = require("../../../constants")

class FetcherLiquity extends Fetcher {
  constructor(protocol) {
    super(protocol)

    this.pool = new Contract(PROTOCOLS_CONFIG.Liquity.CONTROLLER, liquityControllerAbi, this.provider)
  }

  /**
   * Too make proccess efficient we need to splice the whole range of few millions block to a 10000 blocks per iteration.
   * This is also going to help us in case service is corrupted by any reason - save last checkpoint to proceed from.
   *
   * Filter all block logs to find events: "borrow", "borrow on behalf of"
   *
   * @param {*} latestRedisBlock - latest (highest) blocknumber that was proccessed in Redis/PSQL/etc
   * @param {*} latestBlock - latest blocknumber from provider
   */

  async start(latestRedisBlock, latestBlock) {
    this.inProgress = true
    const fromBlock = latestRedisBlock || PROTOCOLS_CONFIG.Liquity.CREATED_AT_BLOCK
    const eventFilter = this.pool.filters.TroveCreated()

    this.iterateBlocksByRange(10_000, fromBlock, latestBlock, async (fromBlock, toBlock) => {
      const events = await this.pool.queryFilter(eventFilter, fromBlock, toBlock)
      const users = events.map(event => event.args._borrower)

      this.emitEvent({ users, toBlock })
      this.emitAllDataProcessed(toBlock, latestBlock)
    })
  }
}

module.exports = {
  FetcherLiquity,
}
