'use strict'
require("./helpers/config.helper")
const { start, stop } = require('./services/events')

/**
 * Start service
 */
start()

/**
 * Finalize on SIGINT
 */
process.on('SIGINT', () => {
  stop()
  process.exit(0)
})
