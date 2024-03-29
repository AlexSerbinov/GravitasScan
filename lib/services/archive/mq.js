const { sendEvent, onBlock } = require("../../mq")

/**
 * Current service name and protocol
 */
const service = "archive"
const protocol = process.env.PROTOCOL

/**
 * Send events only from archive
 * @param {string} ev - event name
 * @param {*} data - event data
 */
const sendArchiveEvent = (ev, data) => {
  sendEvent(service, protocol, ev, data)
}

/**
 * When archive handled chunk of blocks and fetched users.
 * @param {*} data - details
 */
const sendFetchedUsersEvent = (data) => {
  sendArchiveEvent("archive_users", data)
}

/**
 * When archive got user from event
 * @param {*} data - details
 */
const sendMonitoringUsersEvent = (data) => {
  sendArchiveEvent("listener_users", data)
}

/**
 * When error happened.
 * @param {*} data - details
 */
const sendErrorEvent = async (data) => {
  sendArchiveEvent("error", data)
}

/**
 * When archive starts
 * @param {*} data - details
 */
const sendStartEvent = async (data) => {
  sendArchiveEvent("start", data)
}

module.exports = {
  sendFetchedUsersEvent,
  sendMonitoringUsersEvent,
  sendErrorEvent,
  sendStartEvent,
  onBlock,
}
