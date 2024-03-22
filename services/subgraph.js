const defaultSettings = require("../configs/DefaultSettings.json")
const redis = require("../lib/redis/redis/lib/redis")

const { getFetcher } = require("../lib/services/subgraph/data-fetcher")
const { createQueue } = require("../lib/helpers/queue/lib")
const { configurePool } = require("../lib/ethers/pool")
const { createSimulator } = require("../lib/simulator")

const { protocol, formatTrace, stateOverrides } = $.params

const configPath = $.params.configPath
const config = require(`${process.cwd()}${configPath}`) // Load the configuration

// Object.assign(config, { selector }) // Add selector to the config object
const service = "subgraph"

/**
 * Service initial data
 */
configurePool([config.RPC_WSS])

// We prepare redis here because only in this place we have config params. And we don't want to use global variables.
await redis.prepare(config.REDIS_HOST, config.REDIS_PORT) // Check if needed

const settings = defaultSettings.find(s => s.protocol === protocol).services[service]

const EXECUTION_TIMEOUT = 10000 //  This is the time limit for each task's execution within the queue. If a task exceeds this duration, the queue will attempt to move on to the next task, preventing the system from being stalled by tasks that take too long to complete. Adjusting this value can help manage the balance between responsiveness and allowing adequate time for task completion.

/**
 * Interface for enso simulator
 */
const simulator = createSimulator(config.ENSO_URL, formatTrace, stateOverrides)

/**
 * Create fetcher and queue
 */

const fetcher = getFetcher($.params, settings, config, simulator)
const queue = createQueue(async users => await fetcher.fetchSubgraphUsers(users), EXECUTION_TIMEOUT)

/**
 * sleep_time - wait some time before next run (in milliseconds)
 */
const { mode, sleep_time } = settings

$.send("start", { message: `Run in ${mode} mode` })
$.send("start", { message: `${protocol} subgraph started!` })
console.log(`SUBRAPH: started!`)

/**
 * Create fetcher
 */
queue.on("drain", async () => {
  if (sleep_time) {
    await sleep(sleep_time)
  }
  $.send("drain", { message: "Queue is drain, run handling again" }) // TODO uncoment this!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  $.send("subgraph_logs", { message: `send drain event` })
  console.log(`SUBGRAPH: ${protocol}: send drain event`)
})

//Output point
fetcher.on("fetch", data => {
  $.send("sendDataToSearcher", data)
  const date = new Date().toUTCString()
  $.send("subgraph_logs", { date, ...data })
})

fetcher.once("fetcherReady", () => {
  $.send("start", { message: `All data ready, user processing has started` })
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
$.on("handleUsers", async users => {
  queue.add(users)
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
  $.send("errorMessage", { message: error })
})
