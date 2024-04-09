const { sendEvent, getMQ } = require('../../mq')

/**
 * Current service name and protocol
 */
const service = 'events'

/**
 * 
 * @param {*} ev - events name
 * @param {*} data - event data
 * @param {*} protocol - protocol
 */
const sendEvEvent = (ev, data, protocol) => {
  protocol = protocol || 'all'
  sendEvent(service, protocol, ev, data)
}

/**
 * When events starts
 */
const sendStartEvent = () => {
  const date = new Date().toUTCString()
  sendEvEvent('start', {date})
}

/**
 * When evenns stops
 */
const sendStopEvent = () => {
  const date = new Date().toUTCString()
  sendEvEvent('stop', {date})
}

/**
 * When error happend.
 * @param {*} data - details
 * @param {*} protocol - protocol
 */
const sendErrorEvent = (data, protocol) => {
  sendEvEvent('error', data, protocol)
}

/**
 * Send event on new block
 * @param {*} data
 */
const sendBlock = async (data) => {
  const mq = await getMQ()
  mq.notify(`data:block`, data)
}

/**
 * Send event on global reserves
 * @param {*} data
 */
const sendGlobalReserves = async (protocol, data) => {
  const mq = await getMQ()
  mq.notify(`data:reserves:${protocol}`, data)
}

module.exports = {
  sendEvEvent,
  sendStartEvent,
  sendStopEvent,
  sendErrorEvent,
  sendBlock,
  sendGlobalReserves
}
