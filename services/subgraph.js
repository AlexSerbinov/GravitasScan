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

/**
 * Create queue
 */

const queue = createQueue(async user => await fetcher.fetchSubgraphUsers(user))

/**
 * sleep_time - wait some time before next run (in milliseconds)
 */

const { mode, sleep_time } = settings

const sendStartEvent = function (message) {
  console.log("sendStartEvent")

  $.send("start", { message }) // TODO Подивитись як він буде виглядати на виході, щоб не було фігні накшталт data: {message: "mes"}, а щоб було {message: "mes"}. Ну і подивитись як в оригиналі.
}

sendStartEvent({ message: `Run in ${mode} mode` })
sendStartEvent({ message: `${protocol} subgraph started!` })

/**
 * Create fetcher
 */
const fetcher = getFetcher(protocol, settings, config)
let i = 0 // dev

queue.on("drain", async () => {
  if (sleep_time) {
    await sleep(sleep_time)
  }
  console.log("SUBGRAPH: send drain event to proxy")

  $.send("drain", { message: "Queue is drain, run handling again" })
  console.log(`SUBGRAPH: recieved ${i} numbers of batch brfore sending drain event to subgraf`) // dev

  i = 0
  // processUser() // TODO But need to send smth in params.
}) // Check that is 100% correct

fetcher.on("fetch", data => {
  $.send("sendDataToSearcher", data)
  const date = new Date().toUTCString()
  $.send("subgraph_logs", { date, ...data }) // TODO Check and compare with OLD arc
})

fetcher.on("error", data => {
  const { user, error } = data
  $.send("error", data)
  if (error.includes("timeout")) {
    // queue.add(user)  //
  }
})

fetcher.once("fetcherReady", data => {
  sendStartEvent({ message: `All data ready, user processing has started` })
})

/**
 * Listeners
 */
$.on(`onReservesData`, data => {
  fetcher.setGlobalReservesData(data)
})
let lastBatchTime = null
let intervals = []

$.on("parseUsers", async data => {
  const currentTime = Date.now()
  if (lastBatchTime) {
    const interval = currentTime - lastBatchTime
    intervals.push(interval)
    console.log(`PROXY: Interval between batches of users: ${interval} ms`)
  }
  lastBatchTime = currentTime
  processUser(data)
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
    queue.add(user)
  } catch (error) {
    console.error("Error reading allUsers.json:", error)
  }
}

process.on("uncaughtException", error => {
  console.error(error)
  fetcher.emit("errorMessage", error)
})

const mqtt = require("mqtt")
