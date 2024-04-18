const { getFetcher } = require("../lib/services/subgraph/data-fetcher")
const { createQueue } = require("../lib/helpers/queue/lib")
const { configurePool } = require("../lib/ethers/pool")
const { createSimulator } = require("../lib/simulator")
/**
 * @param {number} EXECUTION_TIMEOUT - The time limit for each task's execution within the queue. (ms),
 * If a task exceeds this duration, the queue will attempt to move on to the next task,
 * preventing the system from being stalled by tasks that take too long to complete.
 * Adjusting this value can help manage the balance between responsiveness and allowing adequate time for task completion.
 *
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
 * @param {Function} formattedTrace - A function used in the simulator to format the formattedTrace log. It displays every
 * call between the smart contract, including call, delegate call, etc., providing a complete breakdown of interactions.
 *
 * @param {string} stateOverrides - The bytecode of the smart contract used for simulation. This is utilized
 * to fetch user data using the simulator, effectively representing the bytecode of our smart contract.
 *
 * @param {string} service - The name of the service (e.g., "subgraph", "dataFetcher", "TransmitFetcher" "Proxy", "Archive", etc.)
 *
 * @param {string} enso_url - The url to enso simulator
 */

const { protocol, formattedTrace, stateOverrides, configPath, filters, service, enso_url, EXECUTION_TIMEOUT } = $.params

/**
 * Number of running instances of the service
 */
const forks = $.forks

/**
 *  Load the configuration from Main.json
 */
const config = require(`${process.cwd()}${configPath}`)

/**
 * Service initial data
 */
configurePool([config.RPC_WSS])

/**
 * Interface for enso simulator
 */
const simulator = createSimulator(enso_url, formattedTrace, stateOverrides)

/**
 * Create fetcher and queue
 */

const fetcher = getFetcher($.params, filters, config, simulator)
const queue = createQueue(async users => await fetcher.fetchSubgraphUsers(users), EXECUTION_TIMEOUT)

const { mode } = filters

console.log("subgraph started")
$.send("start", {
  service,
  protocol,
  ev: "start",
  data: `${protocol} subgraph started in ${mode} mode`,
})

/**
 * Create fetcher
 * Proccess all users and then drain queues inbetween proxy<>subgraph and assign some sleep time
 */
queue.on("drain", async () => {
  $.send("drain", { forks })
  const date = new Date().toUTCString()
  $.send("info", {
    service,
    protocol,
    ev: "send_drain_event",
    data: `send drain event ${date}`,
  })
})

/**
 * Output point
 */
fetcher.on("fetch", data => {
  $.send("sendDataToDataFetcher", data)
  fetcher.emit("info", data, "send_user_to_data_fetcher")
})

/**
 * Used for sending logs from other parths of protocol
 */
fetcher.on("info", (data, ev = "info") => {
  console.log(`\nevent = ${ev}`)
  console.log(data, `\n`)
  $.send("info", {
    service,
    protocol,
    ev,
    data: JSON.stringify(data),
  })
})

fetcher.on("errorMessage", (error, ev = "errorMessage") => {
  if (error && error.message) {
    const errorData = { message: error.message }

    $.send("errorMessage", {
      service,
      protocol,
      ev,
      error: errorData,
    })
  }
})

fetcher.once("fetcherReady", () => {
  $.send("start", {
    service,
    protocol,
    ev: "start",
    data: `All data ready, user processing has started`,
  })
})

/**
 * Listeners
 */
$.on(`onReservesData`, data => {
  fetcher.setGlobalReservesData(data)
})

/**
 * Input point from PROXY service
 * Add arrays of users to the queue for processing.
 * Because, in the simulator, we send a batch of users by time.
 * @param {Array} users - Array of users
 */
$.on("handleUser", async users => {
  queue.add(users)
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
process.on("uncaughtException", (error, ev) => {
  $.send("errorMessage", {
    service,
    protocol,
    ev,
    data: error,
  })
})
