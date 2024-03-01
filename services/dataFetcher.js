const { createFetcher } = require("../lib/services/data-fetcher/fetchers")
const { configurePool } = require("../lib/ethers/pool")
const defaultSettings = require("../configs/DefaultSettings.json")
const redis = require("../lib/redis/redis/lib/redis")
const { addUsersToDataFetcherSet, removeUsersFromDataFetcherSet } = require("../lib/redis")

const protocol = $.params.PROTOCOL

// Now we save the path for config params for each protocol in service.json.
const configPath = $.params.configPath
const config = require(`${process.cwd()}${configPath}`)

configurePool([config.RPC_WSS])

// We prepare redis here because only in this place we have config params. And we don't want to use global variables.
await redis.prepare(config.REDIS_HOST, config.REDIS_PORT)

// Moved from config.helper. Earlier this was called syncSettings.
const settings = defaultSettings.find(s => s.protocol === protocol).services["data-fetcher"]

const fetcher = createFetcher(protocol, settings, config) // send config on this way by third param

const sendStartEvent = function () {
  const date = new Date().toUTCString()
  $.send("start", { date })
}

sendStartEvent()

/**
 * Users for long-time watching
 */
fetcher.on("pushToRedis", data => {
  const { user, assets } = data
  for (let index = 0; index < assets.length; index++) {
    addUsersToDataFetcherSet([user], protocol, assets[index])
  }
  $.send("pushToRedis", data)
})
/**
 * When user deletes
 */
fetcher.on("deleteFromRedis", data => {
  const { user, assets } = data
  for (let index = 0; index < assets.length; index++) {
    removeUsersFromDataFetcherSet([user], protocol, assets[index])
  }
  $.send("deleteFromRedis", data)
})

fetcher.on("liquidate", data => {
  $.send("liquidate", data)
})

fetcher.on("info", data => {
  $.send("info", data)
})

fetcher.on("reject", data => {
  $.send("reject", data)
})

fetcher.on("errorMessage", data => { // we use "errorMessage" instead of "error" because "error" is locke by _service
  $.send("errorMessage", { error: data.toString() }) 
})

/**
 * Listening
 */

$.on(`onReservesData`, data => {
  fetcher.setGlobalReservesData(data)
})

$.on(`onSettings`, settings => {
  fetcher.settings = settings
})

/**
 * Main entry point. Listen user's adddresess
 */
$.on("searcherExecute", async data => {
  fetcher.fetchData(data)
})

$.onExit(async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      const { pid } = process
      console.log(pid, "Ready to exit.")
      $.send("stop", { date })
      resolve()
    }, 100) // Set a small timeout to ensure async cleanup can complete
  })
})

process.on("uncaughtException", error => {
  console.error(error)
  fetcher.emit("errorMessage", error)
})
