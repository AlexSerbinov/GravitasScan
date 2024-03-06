const { getMQ, onReservesData, sendEvent } = require("../../mq")

/**
 * Current protocol
 */
const service = "subgraph"
const protocol = process.env.PROTOCOL

/**
 * Send events only from subgraph
 * @param {string} ev - event name
 * @param {*} data - event data
 */
const sendSubgraphEvent = (ev, data) => {
  const date = new Date().toUTCString()
  sendEvent(service, protocol, ev, { date, ...data })
}

/**
 * Send event on global reserves
 * @param {{}} data
 * @param {string} protocol - protocol we are sending for
 */
const sendDataToSearcher = async (data) => {
  const mq = await getMQ()
  mq.notify(`execute:searcher:${protocol}`, data)
  const date = new Date().toUTCString()
  sendEvent("subgraph_logs", protocol, "user", { date, ...data }) // TODO THIS
}

/**
 * When error happened.
 * @param {*} data - details
 */
const sendErrorEvent = async (data) => {
  sendSubgraphEvent("error", data)
}

/**
 * When subgraph starts
 */
const sendStartEvent = async (data) => {
  sendSubgraphEvent("start", data)
}

/**
 * When an error is received during user processing and sent to the queue again.
 * @param {*} data - details
 */
const sendReQueuingEvent = async (data) => {
  sendSubgraphEvent("re-queuing", data)
}

/**
 * When archive users queues on drain.
 * @param {*} data - details
 */
const sendDrainEvent = (data) => {
  sendSubgraphEvent("drain", data)
}

module.exports = {
  sendStartEvent,
  sendDataToSearcher,
  sendErrorEvent,
  sendReQueuingEvent,
  sendDrainEvent,
  onReservesData,
}
