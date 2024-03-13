const fs = require("fs").promises
const { SERVICE_STATUS } = require("../lib/constants")
const defaultSettings = require("../configs/DefaultSettings.json")
const redis = require("../lib/redis/redis/lib/redis")

const { getFetcher } = require("../lib/services/subgraph/data-fetcher")
const { createQueue } = require("../lib/helpers/queue/lib")
const { configurePool } = require("../lib/ethers/pool")

const protocol = $.params.PROTOCOL

const configPath = $.params.configPath
const config = require(`${process.cwd()}${configPath}`)
configurePool([config.RPC_WSS])
const service = "subgraph"

// We prepare redis here because only in this place we have config params. And we don't want to use global variables.
await redis.prepare(config.REDIS_HOST, config.REDIS_PORT) // Check if needed

const settings = defaultSettings.find(s => s.protocol === protocol).services[service]

const EXECUTION_TIMEOUT = 100 //  This is the time limit for each task's execution within the queue. If a task exceeds this duration, the queue will attempt to move on to the next task, preventing the system from being stalled by tasks that take too long to complete. Adjusting this value can help manage the balance between responsiveness and allowing adequate time for task completion.
// const DRAIN_TIMEOUT = 100 + $.forks * 50 || 200 // Timeout before SUBGRAPH will send the drain event to PROXY. If the number of tasks in the queue increases, increase this timeout. The more forks we launch, the higher the value should be.
const DRAIN_TIMEOUT = 100 // Timeout before SUBGRAPH will send the drain event to PROXY. If the number of tasks in the queue increases, increase this timeout. The more forks we launch, the higher the value should be.

const fetcher = getFetcher(protocol, settings, config)
/**
 * Create queue
 */
const queue = createQueue(async user => await fetcher.fetchSubgraphUsers(user), EXECUTION_TIMEOUT, DRAIN_TIMEOUT)
// async user => await fetcher.fetchSubgraphUsers(user)
/**
 * sleep_time - wait some time before next run (in milliseconds)
 */

const { mode, sleep_time } = settings

$.send("start", { message: `Run in ${mode} mode` })
$.send("start", { message: `${protocol} subgraph started!` })
console.log(`SUBRAPH: started! Drain timeout = ${DRAIN_TIMEOUT}`)

/**
 * Create fetcher
 */
let i = 0
queue.on("drain", async () => {
  console.log(`======================= SUBGRAPH: DRAIN EVENT ===================`)

  if (sleep_time) {
    await sleep(sleep_time)
  }
  $.send("drain", { message: "Queue is drain, run handling again" })  // TODO Turn o this to prod !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  console.log(`SUBGRAPH: ${protocol}: DRAIN EVENT: recieved ${i} batch before sending drain`) // dev
  i = 0
  // processUser() // TODO: ASK Serhiy do we need it here or not // I think not need
}) //

fetcher.on("fetch", data => {
  $.send("sendDataToSearcher", data)
  const date = new Date().toUTCString()
  $.send("subgraph_logs", { date, ...data }) // TODO Check and compare with OLD arc
})

fetcher.once("fetcherReady", data => {
  $.send("start", { message: `All data ready, user processing has started` })
})

/**
 * Listeners
 */
$.on(`onReservesData`, data => {
  fetcher.setGlobalReservesData(data)
})
let lastBatchTime = null

$.on("parseUsers", async data => {
  const currentTime = Date.now()
  if (lastBatchTime) {
    const interval = currentTime - lastBatchTime
    // console.log(`SUBGRAPH: Interval between batches of users: ${interval} ms`)
  }
  lastBatchTime = currentTime
  console.log(`SUBGRAPH: ${protocol}: recieved ${i} number of batch`) // dev

  data.forEach(userData => {
    processUser(userData)
    // console.log(`======================= done ${i} ===================`)
  })

  i++ //dev
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

const processUser = async data => {
  try {
    const user = data.user
    // console.log(`1----=-----=----=----=----=----=----- length -----=-----=-----=-----=-- 1`)
    // console.log(queue.length)
    // console.log(`2----=-----=----=----=----=----=----- length -----=-----=-----=-----=-- 2`)

    queue.add(user)
  } catch (error) {
    $.send("errorMessage", { message: error })
    console.error("Error reading allUsers.json:", error)
  }
}

process.on("uncaughtException", error => {
  console.error(error)
  $.send("errorMessage", { message: error })
})

const mqtt = require("mqtt")
