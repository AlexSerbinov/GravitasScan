'use strict'
const {EventEmitter} = require('node:events')
const {assert} = require('./assert')

/**
 * Logger event bus
 */
const logger = new EventEmitter()

/**
 * Log info
 * @param {string} type - type name
 * @param {*} data - some object
 */
function info(type, data) {
  assert(
    typeof data === 'object',
    'Data should be an object.'
  )
  logger.emit('info', {type, data})
}

module.exports = {
  logger, info
}
