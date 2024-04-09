const { getProvider } = require('../../ethers/pool')
const { EventEmitter } = require('node:events')

/**
 * Class that will look for new block and send events
 */
class BlockWatcher {

  /**
   * Use createBlockWatcher()
   */
  constructor() {
    const provider = getProvider()
    provider.on('error', e => {
      this.resetProvider()
      this.events.emit('error', e)
    })
    this.provider = provider
    this.blockNumber = 0
    this.events = new EventEmitter()
    this.started = false
  }

  /**
   * Release current and get new provider
   */
  resetProvider() {
    this.provider = getProvider()
  }
  
  /**
   * Start watching for new block
   * @param {number} interval - requests interval
   * @returns BlockWatcher
   */
  start(interval) {
    if (this.started) return this
    this.started = true
    const { provider } = this
    this.int = setInterval(async () => {
      const number = await provider.getBlockNumber()
      if (number === this.blockNumber) return
      this.blockNumber = number
      this.events.emit('block', number)
    }, interval)
    return this
  }

  /**
   * Stop watching, clean interval, and release provider
   * @returns BlockWatcher
   */
  stop() {
    const { int } = this
    clearInterval(int)
    this.started = false
    return this
  }

  /**
   * Add event listener for new block
   * @param {Function} listener - calback
   * @returns {BlockWatcher}
   */
  onBlock(listener) {
    this.events.on('block', listener)
    return this
  }

  /**
   * Listen error events
   * @returns {BlockWatcher}
   */
  onError(listener) {
    const { events } = this
    events.on('error', listener)
    return this
  }
}

/**
 * Default factory
 * @returns BlockWatcher
 */
const createBlockWatcher = () => new BlockWatcher()

module.exports = { createBlockWatcher, BlockWatcher }
