const { getMQ, sendEvent, onReservesData } = require("../../mq")

/**
 * Current service name and protocol
 */
const service = "data-fetcher"
const protocol = process.env.PROTOCOL

/**
 * Send events only from searcher
 * @param {string} ev - event name
 * @param {*} data - event data
 */
const sendDataFetcherEvent = (ev, data) => {
    sendEvent(service, protocol, ev, data)
}

/**
 * When searcher deleted user.
 * @param {*} data - details
 */
const sendDeleteFromRedisEvent = data => {
    sendDataFetcherEvent("deleteFromRedis", data)
}

/**
 * When searcher rejected user.
 * @param {*} data - details
 */
const sendRejectEvent = data => {
    sendDataFetcherEvent("reject", data)
}

/**
 * When searcher queues on drain.
 * @param {*} data - details
 */
const sendDrainEvent = data => {
    sendDataFetcherEvent("drain", data)
}

/**
 * When user back to watchlist.
 * @param {*} data - details
 */
const sendPushToRedisEvent = data => {
    sendDataFetcherEvent("pushToRedis", data)
}

/**
 * When error happend.
 * @param {*} data - details
 */
const sendErrorEvent = data => {
    sendDataFetcherEvent("error", data)
}

/**
 * When user liquidates.
 * @param {*} data - details
 */
const sendLiquidateEvent = data => {
    sendDataFetcherEvent("liquidate", data)
}

/**
 * When searcher starts
 */
const sendStartEvent = () => {
    const date = new Date().toUTCString()
    sendDataFetcherEvent("start", { date })
}

/**
 * When searcher stops
 */
const sendStopEvent = () => {
    const date = new Date().toUTCString()
    sendDataFetcherEvent("stop", { date })
}

/**
 * Send event to execute some reserve
 * @param {Object} data - Reserve data
 */
const sendLiquidateCommand = async data => {
    const mq = await getMQ()
    mq.notify(`execute:liquidator:${protocol}`, data)
    sendLiquidateEvent(data)
}

/**
 * Subscribe to events from subgraph to searcher
 * @param {Function} - callback
 */
const onSearcherExecute = async listener => {
    const mq = await getMQ()
    mq.subscribe(`execute:searcher:${protocol}`, listener)
}

/**
 * Update searcher settings
 * @param {Function} listener
 */
const onSettings = async listener => {
    const mq = await getMQ()
    mq.subscribe(`settings:data-fetcher:${protocol}`, listener)
}

module.exports = {
    sendDeleteFromRedisEvent,
    sendRejectEvent,
    sendDrainEvent,
    sendPushToRedisEvent,
    sendErrorEvent,
    sendLiquidateCommand,
    onSearcherExecute,
    onReservesData,
    onSettings,
    sendStartEvent,
    sendStopEvent,
}
