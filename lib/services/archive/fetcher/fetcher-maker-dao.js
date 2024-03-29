const { Contract } = require("ethers")
const { Fetcher } = require("./fetcher")
const makerDAOCdpCreateAbi = require("../../../artifacts/makerdao/CdpCreate")
const { PROTOCOLS_CONFIG } = require("../../../constants")

class FetcherMakerDAO extends Fetcher {
  constructor(protocol) {
    super(protocol)

    this.pool = new Contract(PROTOCOLS_CONFIG.MakerDAO.CDP_MANAGER, makerDAOCdpCreateAbi, this.provider)
  }

  async start(latestDbBlock, latestBlock) {
    this.inProgress = true
    const fromBlock = latestDbBlock || PROTOCOLS_CONFIG.MakerDAO.CDP_MANAGER_CREATED_AT_BLOCK
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
