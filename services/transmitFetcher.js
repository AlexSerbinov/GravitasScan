const { createTransmitFetcher } = require("../lib/services/transmit/fetchers")
const { configurePool } = require("../lib/ethers/pool")
const redis = require("../lib/redis/redis/lib/redis")
const { createSimulator } = require("../lib/simulator")

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
 * @param {Function} formattedTrace - A function used in the simulator to format the formattedTrace log. It displays every
 * call between the smart contract, including call, delegate call, etc., providing a complete breakdown of interactions.
 *
 * @param {string} stateOverrides - The bytecode of the smart contract used for simulation. This is utilized
 * to fetch user data using the simulator, effectively representing the bytecode of our smart contract.
 *
 * @param {string} enso_url - The url to enso simulator
 */
const { protocol, configPath, filters, service, formattedTrace, stateOverrides, enso_url } = $.params

/**
 * Now we save the path for config params for each protocol in [serviceName]service.json file.
 */
const config = require(`${process.cwd()}${configPath}`)

configurePool([config.RPC_WSS])

/**
 * We prepare redis here because only in this place we have config params. And we don't want to use global variables.
 */
await redis.prepare(config.REDIS_HOST, config.REDIS_PORT)

/**
 * Interface for enso simulator
 */
const simulator = createSimulator(enso_url, formattedTrace, stateOverrides)

const fetcher = createTransmitFetcher(protocol, filters, config, simulator)

$.send("start", {
  service,
  protocol,
  ev: "start",
  data: { date: new Date().toUTCString() },
})
console.log(`TransmitFetcher started ${protocol}`)

fetcher.on("response", async data => {
  if (data.simulateData.length == 0) return
  let userToLiquidate = fetcher.userToExecute(data)
  if (userToLiquidate.length == 0) return
  userToLiquidate.forEach(userData => fetcher.executeUser(userData.user, userData.hf, data.rawTransmit))
})

fetcher.on("liquidate", data => {
  $.send("liquidateCommand", data.resp)
  fetcher.emit("info", data.resp, "liquidate_event")
})

fetcher.on("info", (data, ev = "info") => {
  console.log(`\n event = ${ev}`)
  console.log(data)
  $.send("info", {
    service,
    protocol,
    ev,
    data: JSON.stringify(data),
  })
})

fetcher.on("errorMessage", data => {
  $.send("errorMessage", {
    service,
    protocol,
    ev: "error_message",
    data: { error: JSON.stringify(data) },
  })
})

$.on(`onReservesData`, data => {
  fetcher.setGlobalReservesData(data)
})

$.on("transmit", async data => {
  try {
    fetcher.emit("info", data, "input_transmit")
    if (!data.assets || !Object.keys(data.assets).includes(protocol)) {
      return
    }

    const usersByAssets = await fetcher.getUsersByAsset(data.assets[`${protocol}`])
    if (usersByAssets.length == 0) return
    fetcher.emit("info", `Simulations started`, `simulations_started`)
    usersByAssets.forEach((user, index) => {
      fetcher.request(user, data, index + 1 == usersByAssets.length)
    })
  } catch (error) {
    fetcher.emit("errorMessage", error)
  }
})

/**
 * Handle process exit
 */
$.onExit(async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      const { pid } = process
      console.log(pid, "Ready to exit.")
      const date = new Date().toUTCString()
      $.send("stop", {
        service,
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
    service,
    protocol,
    ev: "error_message",
    data: error,
  })
})
