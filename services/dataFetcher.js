const { syncSettings } = require("../lib/helpers/config.helper") // for dev, before set up config vai params in fetcer
const { createFetcher } = require("../lib/services/data-fetcher/fetchers")

const { configurePool } = require("../lib/ethers/pool")
const defaultSettings = require("../configs/DefaultSettings.json")
const redis = require("../lib/redis/redis/lib/redis")
const { addUsersToDataFetcherSet, removeUsersFromDataFetcherSet } = require("../lib/redis")

const protocol = $.params.PROTOCOL

const settings = await syncSettings(protocol, "data-fetcher") // for dev, before set up config vai params in fetcer

// Now we save the path for config params for each protocol in service.json.
const configPath = $.params.configPath
const config = require(`${process.cwd()}${configPath}`)

configurePool([config.RPC_WSS])

// We prepare redis here because only in this place we have config params. And we don't want to use global variables.
await redis.prepare(config.REDIS_HOST, config.REDIS_PORT)

// Moved from config.helper. Earlier this was called syncSettings.
// const settings = defaultSettings.find(s => s.protocol === protocol).services["data-fetcher"]

// let fetcher = createTransmitFetcher(protocol, settings, config)
const fetcher = createFetcher(protocol, settings) // send config on this way by third param

const sendStartEvent = function () {
  const date = new Date().toUTCString()
  $.send("start", { m: date })
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
  $.send("liquidate", data.resp)
})

fetcher.on("info", data => {
  $.send("info", data)
})

fetcher.on("reject", data => {
  $.send("reject", data)
})

fetcher.on("error", data => {
  $.send("error", data)
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

$.on("searcherExecute", async data => {
    console.log(`======================= searcherExecute ===================`)
    
  // remove logic from this func. Maybe not need to do anything!?
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
