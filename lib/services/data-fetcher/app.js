const { syncSettings } = require("../../helpers/config.helper")
const { createFetcher } = require("./fetchers")

const {
  sendDeleteFromRedisEvent,
  sendRejectEvent,
  sendPushToRedisEvent,
  sendErrorEvent,
  sendLiquidateCommand,
  onSearcherExecute,
  onReservesData,
  onSettings,
  sendStartEvent,
  sendStopEvent,
} = require("./mq")

const { addUsersToDataFetcherSet, removeUsersFromDataFetcherSet } = require("../../redis")
const { configurePool } = require("../../ethers/pool")

configurePool([process.env.RPC_WSS])
/**
 * Initiate
 */
const start = async () => {
  const protocol = process.env.PROTOCOL
  const settings = await syncSettings(protocol, "data-fetcher")

  /**
   * Initiate
   */
  const fetcher = createFetcher(protocol, settings)

  /**
   * Users for long-time watching
   */
  fetcher.on("pushToRedis", data => {
    const { user, assets } = data
    for (let index = 0; index < assets.length; index++) {
      addUsersToDataFetcherSet([user], protocol, assets[index])
    }
    sendPushToRedisEvent(data)
  })

  /**
   * When user deletes
   */
  fetcher.on("deleteFromRedis", data => {
    const { user, assets } = data
    for (let index = 0; index < assets.length; index++) {
      removeUsersFromDataFetcherSet([user], protocol, assets[index])
    }
    sendDeleteFromRedisEvent(data)
  })

  /**
   * When user liquidates
   */
  fetcher.on("liquidate", data => {
    sendLiquidateCommand(data)
  })

  /**
   * else
   */
  fetcher.on("reject", data => sendRejectEvent(data))
  fetcher.on("error", data => sendErrorEvent(data))

  /**
   * Listening
   */
  onReservesData(protocol, data => {
    fetcher.setGlobalReservesData(data)
  })

  onSearcherExecute(data => {
    fetcher.fetchData(data)
  })

  onSettings(settings => {
    fetcher.settings = settings
  })

  sendStartEvent()
}

/**
 * When searcher stops
 */
const stop = () => sendStopEvent()

/**
 * Send uncaughtException as event
 */
process.on("uncaughtException", sendErrorEvent)

module.exports = { start, stop }
