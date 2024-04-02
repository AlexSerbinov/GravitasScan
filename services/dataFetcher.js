const { createFetcher } = require("../lib/services/data-fetcher/fetchers")
const { configurePool } = require("../lib/ethers/pool")
const redis = require("../lib/redis/redis/lib/redis")
const { addUsersToDataFetcherSet, removeUsersFromDataFetcherSet } = require("../lib/redis")

/**
 * @param {*} settings - The settings object containing the following properties:
 *  - mode: The mode of operation (e.g. "fetch")
 *  - min_collateral_amount: The minimum collateral amount
 *  - min_borrow_amount: The minimum borrow amount
 *  - min_health_factor: The minimum health factor
 *  - max_health_factor: The maximum health factor
 *  - update_time: The update time in seconds
 *
 * @param {string} protocol - The name of the lending protocol (e.g., "V1", "V2", "V3" "Compound")
 *
 * @param {string} configPath - Path to the configuration file Main.json, that contains necessary settings and parameters for the service.
 * This file includes configurations such as database connections, service endpoints, and other operational parameters.
 */

const { protocol, configPath, settings } = $.params

// Main.json
const config = require(`${process.cwd()}${configPath}`)

configurePool([config.RPC_WSS])

// We prepare redis here because only in this place we have config params. And we don't want to use global variables.
await redis.prepare(config.REDIS_HOST, config.REDIS_PORT)

const fetcher = createFetcher(protocol, settings, config)

$.send("start", { date: new Date().toUTCString() })

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
 * Delete even if there is no uses - prevent double checking and time consuption
 */
fetcher.on("deleteFromRedis", data => {
  const { user, assets } = data
  for (let index = 0; index < assets.length; index++) {
    removeUsersFromDataFetcherSet([user], protocol, assets[index])
  }
  $.send("deleteFromRedis", data)
})

fetcher.on("liquidate", data => {
  console.log(`======================= liq ===================`)
  console.log(`1----=-----=----=----=----=----=----- data -----=-----=-----=-----=-- 1`)
  console.log(data);
  console.log(`2----=-----=----=----=----=----=----- data -----=-----=-----=-----=-- 2`)
  
  $.send("liquidateCommand", data)
  $.send("liquidateEvent", data)
})

fetcher.on("info", data => {
  $.send("info", data)
})

fetcher.on("reject", data => {
  $.send("reject", data)
})

fetcher.on("errorMessage", data => {
  // we use "errorMessage" instead of "error" because "error" is locked by _service
  $.send("errorMessage", { error: data.toString() })
})

/**
 * Listening
 */

$.on(`onReservesData`, data => {
  fetcher.setGlobalReservesData(data)
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
