const { EventEmitter } = require("node:events")
const { getProvider } = require("../../../ethers/pool")

class Fetcher extends EventEmitter {
  constructor(protocol) {
    super()
    this.protocol = protocol

    const provider = getProvider()
    provider.on("error", (e) => this.resetProvider())

    this.provider = provider
    this.inProgress = false
  }

  /**
   * Fetcher entry point
   */
  async start(latestDbBlock) {
    throw new Error("Method not implemented.")
  }

  /**
   * send data to entry point - index.js
   */
  emitEvent(data) {
    this.emit("fetch", data)
  }

  /**
   * Send event when all data has been processed
   */
  emitAllDataProcessed(toBlock, latestBlock) {
    if (toBlock >= latestBlock) {
      this.inProgress = false
      this.emit("finished", { latestBlock })
    }
  }

  /**
   * Release current and get new provider
   */
  resetProvider() {
    this.provider = getProvider()
  }

  /**
   * Get current RPC provider
   * @returns {Provider} - provider from @npm/ethers
   */
  getProvider() {
    return this.provider
  }

  /**
   * Process data by chunks
   */
  async iterateBlocksByRange(rangeSize, fromBlock, endBlock, callback) {
    while (fromBlock < endBlock) {
      const toBlock = fromBlock + rangeSize > endBlock ? endBlock : fromBlock + rangeSize

      await callback(fromBlock, toBlock)

      fromBlock += rangeSize + 1
    }
  }

  /**
   * Get array of users from borrow event
   */
  handleUsers(params) {
    const { user = "", onBehalfOf = "" } = params
    return [...new Set([user, onBehalfOf])].filter(Boolean)
  }

  /**
   * Get latest block
   */
  async getLatestBlock() {
    return await this.provider.getBlockNumber()
  }
}

module.exports = {
  Fetcher,
}
