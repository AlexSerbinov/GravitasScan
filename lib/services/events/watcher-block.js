const { getProvider } = require("../../ethers/pool")
const { EventEmitter } = require("node:events")

/**
 * Class that will look for new block and send events.
 * It can use HTTP/HTTPS for polling or WS/WSS for WebSocket connection to monitor new blocks.
 */
class BlockWatcher {
  /**
   * Constructor for the BlockWatcher class.
   */
  constructor() {
    this.events = new EventEmitter()
    this.started = false
  }
  /**
   * Start monitoring for new blocks.
   * Starts only once.
   * @param {string} mode - the mode of operation: 'http', 'https', 'ws', or 'wss'
   * @param {number} interval - the polling interval in milliseconds for HTTP/HTTPS mode
   * @returns {BlockWatcher}
   */
  start(interval = 10) {
    if (this.started) return this
    this.interval = interval
    this.started = true

    const poll = async () => {
      if (!this.started) return
      const provider = getProvider()
      const number = await provider.getBlockNumber()
      if (number !== this.blockNumber) {
        this.blockNumber = number
        const date = new Date().toISOString()
        console.log(`new block ${number} received. Updating interval = ${this.interval} ms, ${date}`)
        this.events.emit("block", number)
      }
    }
    this.intervalId = setInterval(poll, interval)
    return this
  }

  /**
   * Stop monitoring for new blocks.
   * @returns {BlockWatcher}
   */
  stop() {
    this.started = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    getProvider().removeAllListeners("block")
    return this
  }

  /**
   * Add an event listener for the new block.
   * @param {Function} listener - callback function for new block event
   * @returns {BlockWatcher}
   */
  onBlock(listener) {
    this.events.on("block", listener)
    return this
  }

  /**
   * Add an event listener for errors.
   * @param {Function} listener - callback function for error event
   * @returns {BlockWatcher}
   */
  onError(listener) {
    this.events.on("error", listener)
    return this
  }
}

/**
 * Factory function to create a new BlockWatcher instance.
 * @returns {BlockWatcher}
 */
const createBlockWatcher = () => new BlockWatcher()

module.exports = { createBlockWatcher, BlockWatcher }
