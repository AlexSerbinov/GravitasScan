const { Contract } = require("ethers")
const { Fetcher } = require("./fetcher")
const makerDAOCdpCreateAbi = require("../../../artifacts/makerdao/CdpCreate")
const { PROTOCOLS_CONFIG } = require("../../../constants")

class FetcherMakerDAO extends Fetcher {
  constructor(protocol) {
    super(protocol)

    this.pool = new Contract(PROTOCOLS_CONFIG.MakerDAO.CDP_MANAGER, makerDAOCdpCreateAbi, this.provider)
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
    const fromBlock = latestRedisBlock || PROTOCOLS_CONFIG.MakerDAO.CDP_MANAGER_CREATED_AT_BLOCK
    const eventFilter = this.pool.filters.NewCdp()

    this.iterateBlocksByRange(10_000, fromBlock, latestBlock, async (fromBlock, toBlock) => {
      const events = await this.pool.queryFilter(eventFilter, fromBlock, toBlock)

      const users = events.reduce((acc, event) => {
        const { usr = "", own = "" } = event.args
        const userAddresses = [...new Set([usr, own])].filter(Boolean)
        return [...acc, ...userAddresses]
      }, [])

      this.emitEvent({ users, toBlock })
      this.emitAllDataProcessed(toBlock, latestBlock)
    })
  }
}

module.exports = {
  FetcherMakerDAO,
}
