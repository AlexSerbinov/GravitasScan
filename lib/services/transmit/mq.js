const { getMQ, sendEvent, onReservesData } = require("../../mq")

/**
 * Current service name and protocol
 */
const service = "transmit_fetcher"
const protocol = process.env.PROTOCOL

/**
 * Send events only from searcher
 * @param {string} ev - event name
 * @param {*} data - event data
 */
const sendTransmitFetcherEvent = (ev, data) => {
  sendEvent(service, protocol, ev, data)
}

/**
 * When searcher rejected user.
 * @param {*} data - details
 */
const sendRejectEvent = data => {
  sendTransmitFetcherEvent("reject", data)
}

/**
 * When error happend.
 * @param {*} data - details
 */
const sendDeleteEvent = data => {
  sendTransmitFetcherEvent("delete", data)
}

/**
 * When error happend.
 * @param {*} data - details
 */
const sendErrorEvent = data => {
  sendTransmitFetcherEvent("error", data)
}

/**
 * When searcher starts
 */
const sendStartEvent = () => {
  const date = new Date().toUTCString()
  sendTransmitFetcherEvent("start", { date })
}

/**
 * When searcher stops
 */
const sendStopEvent = () => {
  const date = new Date().toUTCString()
  sendTransmitFetcherEvent("stop", { date })
}

/**
 * Send event to execute some reserve
 * @param {Object} data - Reserve data
 */
const sendLiquidateCommand = async data => {
  const mq = await getMQ()
  mq.notify(`execute:liquidator:${protocol}`, data)
  sendTransmitFetcherEvent("liquidate", data.resp)
}

/**
 * Update searcher settings
 * @param {Function} listener
 */
const onSettings = async listener => {
  const mq = await getMQ()
  mq.subscribe(`settings:searcher:${protocol}`, listener)
}
/**
 * Subscribe to events from transmit data fetcher to transmit fetcher
 * @param {Function} - callback
 */
const onTransmit = async (protocol, listener) => {
  const mq = await getMQ()
  mq.subscribe("data/eth/pending/transmit_assets", listener)
}

module.exports = {
  onTransmit,
  sendTransmitFetcherEvent,
  sendRejectEvent,
  sendErrorEvent,
  sendLiquidateCommand,
  onReservesData,
  sendDeleteEvent,
  onSettings,
  sendStartEvent,
  sendStopEvent,
}
