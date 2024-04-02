const { createTransmitFetcher } = require("../lib/services/transmit/fetchers")
const { configurePool } = require("../lib/ethers/pool")
const redis = require("../lib/redis/redis/lib/redis")

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

// Now we save the path for config params for each protocol in service.json.

const config = require(`${process.cwd()}${configPath}`)

configurePool([config.RPC_WSS])

// We prepare redis here because only in this place we have config params. And we don't want to use global variables.
await redis.prepare(config.REDIS_HOST, config.REDIS_PORT)

// Moved from config.helper. Earlier this was called syncSettings.

const fetcher = createTransmitFetcher(protocol, settings, config)

fetcher.on("response", async data => {
  if (data.simulateData.length == 0) return
  let userToLiquidate = fetcher.userToExecute(data)
  if (userToLiquidate.length == 0) return
  userToLiquidate.forEach(userData => fetcher.executeUser(userData.user, userData.hf, data.rawTransmit))
})

fetcher.on("liquidate", data => {
  
  $.send("liquidateCommand", data.resp)
  $.send("liquidateEvent", data.resp)
})

fetcher.on("info", data => {
  $.send("info", data)
})

fetcher.on("delete", data => {
  $.send("delete", data)
})

fetcher.on("reject", data => {
  $.send("reject", data)
})

fetcher.on("errorMessage", data => {
  // we use "errorMessage" instead of "error" because "error" is locked by _service
  $.send("errorMessage", { error: data.toString() })
})

$.on(`onReservesData`, data => {
  fetcher.setGlobalReservesData(data)
})

$.send("start", { date: new Date().toUTCString() })

$.on("transmit", async data => {
  if (!Object.keys(data.assets).includes(protocol)) {
    return
  }
  const usersByAssets = await fetcher.getUsersByAsset(data.assets[`${protocol}`])
  if (usersByAssets.length == 0) return
  usersByAssets.forEach((user, index) => {
    fetcher.request(user, data, index + 1 == usersByAssets.length)
  })
})

$.onExit(async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      const { pid } = process
      console.log(pid, "Ready to exit.")
      const date = new Date().toUTCString()
      $.send("stop", { date })
      resolve()
    }, 100) // Set a small timeout to ensure async cleanup can complete
  })
})

process.on("uncaughtException", error => {
  console.error(error)
  fetcher.emit("errorMessage", error)
})
