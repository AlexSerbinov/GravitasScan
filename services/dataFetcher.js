const { createFetcher } = require("../lib/services/data-fetcher/fetchers")
const { configurePool } = require("../lib/ethers/pool")
const redis = require("../lib/redis/redis/lib/redis")
const { addUsersToDataFetcherSet, removeUsersFromDataFetcherSet } = require("../lib/redis")

/**
 * @param {*} filters - The filters object containing the following properties:
 *  - mode: The mode of operation (e.g. "fetch")
 *  - min_collateral_amount: The minimum collateral amount
 *  - min_borrow_amount: The minimum borrow amount
 *  - min_health_factor: The minimum health factor
 *  - max_health_factor: The maximum health factor
 *  - update_time: The update time in seconds
 *
 * @param {string} protocol - The name of the lending protocol (e.g., "V1", "V2", "V3" "Compound")
 *
 * @param {string} configPath - Path to the configuration file Main.json, that contains necessary filters and parameters for the service.
 * This file includes configurations such as database connections, service endpoints, and other operational parameters.
 *
 * @param {string} service - The name of the service (e.g., "subgraph", "dataFetcher", "TransmitFetcher" "Proxy", "Archive", etc.)
 *
 */

const { protocol, configPath, filters, service } = $.params

// Main.json
const config = require(`${process.cwd()}${configPath}`)

configurePool([config.RPC_WSS])

/**
 * We prepare redis here because only in this place we have config params. And we don't want to use global variables.
 */
await redis.prepare(config.REDIS_HOST, config.REDIS_PORT)

const fetcher = createFetcher(protocol, filters, config)

console.log(`dataFetcher started ${protocol}`)
$.send("start", {
  service,
  protocol,
  ev: "start",
  data: { date: new Date().toUTCString() },
})

/**
 * Users for long-time watching
 */
fetcher.on("pushToRedis", data => {
  const { user, assets } = data
  for (let index = 0; index < assets.length; index++) {
    addUsersToDataFetcherSet([user], protocol, assets[index])
  }
  // $.send("info", {
  //   service,
  //   protocol,
  //   ev: "pushToRedis",
  //   data: JSON.stringify(data),
  // })
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
  $.send("deleteFromRedis", {
    service,
    protocol,
    ev: "deleteFromRedis",
    data,
  })
})

fetcher.on("liquidate", data => {
  console.log(`send liquidate Command`, data)
  $.send("liquidateCommand", data)
  fetcher.emit("info", data, "liquidate_event")
})

fetcher.on("info", (data, ev = "info") => {
  $.send("info", {
    service,
    protocol,
    ev,
    data,
  })
})

fetcher.on("reject", data => {
  $.send("reject", {
    service,
    protocol,
    ev: "reject",
    data,
  })
})

fetcher.on("errorMessage", data => {
  $.send("errorMessage", {
    service,
    protocol,
    ev: "error_message",
    data: JSON.stringify(data),
  })
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
  console.log(`dataFetcher ${protocol} Recieved input address ${JSON.stringify(data)}`)
  $.send("info", {
    service,
    protocol,
    ev: "Recieved input address",
    data: JSON.stringify(data),
  })
  fetcher.fetchData(data)
})

/**
 * Handle process exit
 */
$.onExit(async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      const { pid } = process
      const date = new Date().toUTCString()
      $.send("stop", {
        service: "subgraph",
        protocol,
        ev: "stop",
        data: date,
      })
      resolve()
    }, 100) // Small timeout to ensure async cleanup completes
  })
})

// Handle uncaught exceptions
process.on("uncaughtException", error => {
  $.send("errorMessage", {
    service: "subgraph",
    protocol,
    ev: "error_message",
    data: error,
  })
})
