const mq = require("./mq/lib")

/**
 * Single MQ getter
 * @returns
 */
const getMQ = async () => {
  if (mq.isReady()) return mq
  await mq.prepare("mqtt://10.10.13.23") // TODO remove all folder
  return mq
}

/**
 * Subscribe for global reserves data
 * @param {string} protocol - V1, V2, V3...
 * @param {Function} listener - callback
 */
const onReservesData = async (protocol, listener) => {
  const mq = await getMQ()
  mq.subscribe(`data:reserves:${protocol}`, listener)
}

/**
 * Subscribe to new block
 */
const onBlock = async listener => {
  const mq = await getMQ()
  mq.subscribe(`data:block`, listener)
}

/**
 * Send event to MQ
 * @param {*} service - service name
 * @param {*} protocol - protocol
 * @param {*} ev - event name
 * @param {*} data - event data
 */
const sendEvent = async (service, protocol, ev, data) => {
  const mq = await getMQ()
  data = data || {}
  mq.notify(`event:${ev}:${service}:${protocol}`, data)
  mq.notify(`__events`, { service, protocol, ev, data })
}

module.exports = {
  getMQ,
  onReservesData,
  onBlock,
  sendEvent,
}
