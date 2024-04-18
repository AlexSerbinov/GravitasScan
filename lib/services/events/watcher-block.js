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
    this.provider = getProvider()
    this.events = new EventEmitter()
    this.started = false
  }

  /**
   * Reset the current provider and set up a new one, appropriate for the current mode.
   */
  resetProvider() {
    this.provider = getProvider()
    if (this.mode === "ws" || this.mode === "wss") {
      this.provider.on("block", number => {
        this.events.emit("block", number)
      })
    }
  }

  /**
   * Reset the provider and reattach the block event listener.
   */
  resetProviderAndReattachListener() {
    this.resetProvider()
    this.provider.on("block", number => {
      const date = new Date().toISOString()
      console.log(`new block ${number} received via ${this.mode}, ${date}`)
      this.events.emit("block", number)
      this.resetProviderAndReattachListener()
    })
  }

  /**
   * Periodically reset provider and reattach listeners to clear memory.
   */
  // resetProviderPeriodically() {
  //   setInterval(() => {
  //     this.provider.removeAllListeners("block")
  //     this.provider.on("block", number => {
  //       const date = new Date().toISOString()
  //       console.log(`new block ${number} received via ${this.mode}, ${date}`)
  //       this.events.emit("block", number)
  //     })
  //   }, 600000) // every 10 minutes
  // }

  /**
   * Start monitoring for new blocks.
   * Starts only once.
   * @param {string} mode - the mode of operation: 'http', 'https', 'ws', or 'wss'
   * @param {number} interval - the polling interval in milliseconds for HTTP/HTTPS mode
   * @returns {BlockWatcher}
   */
  start(mode = "ws", interval = 10) {
    if (typeof mode !== "string") {
      throw new TypeError("Mode must be a string")
    }
    if (this.started) return this
    this.mode = mode.toLowerCase()
    this.interval = interval
    this.started = true

    this.provider.on("error", e => {
      this.resetProvider()
      this.events.emit("error", e)
    })

    if (this.mode === "ws" || this.mode === "wss") {
      this.provider.on("block", number => {
        const date = new Date().toISOString()
        console.log(`new block ${number} received via ${this.mode}, ${date}`)
        this.events.emit("block", number)
        this.resetProviderAndReattachListener() // TODO: think with @Serhiy Didkovkiy.
        // I think this bad idea to call recursion function. But I don't know now another way, sicne like start() start only once.
        // And I also don't anderstand why we should reset provider after block recieved, if we dont' have any error. So maybe etter too just delete this function.
      })
    } else if (this.mode === "http" || this.mode === "https") {
      this.getBlockHttp()
    }

    return this
  }

  /**
   * Schedule HTTP polling for new blocks.
   */
  getBlockHttp() {
    const poll = async () => {
      if (!this.started) return
      const provider = getProvider()
      const number = await provider.getBlockNumber()
      if (number !== this.blockNumber) {
        this.blockNumber = number
        const date = new Date().toISOString()
        console.log(`new block ${number} received via ${this.mode}. Updating interval = ${this.interval} ms, ${date}`)
        this.events.emit("block", number)
      }
      setTimeout(poll, this.interval)
    }
    poll()
  }

  /**
   * Stop monitoring for new blocks.
   * @returns {BlockWatcher}
   */
  stop() {
    this.started = false
    if (this.mode === "ws" || this.mode === "wss") {
      this.provider.removeAllListeners("block")
    }
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
