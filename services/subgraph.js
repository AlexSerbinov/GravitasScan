const fs = require("fs").promises
const { getArchiveOrSubgraphUsers } = require("../lib/services/subgraph/utils") // No more needed
const { SERVICE_STATUS } = require("../lib/constants")
const defaultSettings = require("../configs/DefaultSettings.json")
const redis = require("../lib/redis/redis/lib/redis") // Check if needed

const { getFetcher } = require("../lib/services/subgraph/data-fetcher")
const { Queue, createQueue } = require("../lib/helpers/queue/lib")
const { configurePool } = require("../lib/ethers/pool")

const protocol = $.params.PROTOCOL

const configPath = $.params.configPath
const config = require(`${process.cwd()}${configPath}`)
configurePool([config.RPC_WSS])
const service = "subgraph"

//If nedeed
// We prepare redis here because only in this place we have config params. And we don't want to use global variables.
await redis.prepare(config.REDIS_HOST, config.REDIS_PORT) // Check if needed

const { checkUserInBlacklist } = require("../lib/redis")

const settings = defaultSettings.find(s => s.protocol === protocol).services[service]

/**
 * Create queue
 */

const queue = createQueue(async user => fetcher.fetchSubgraphUsers(user)) // TODO Головне питання чи потрібен мені queue ?
// getArchiveOrSubgraphUsers(protocol, queue)

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

fetcher.on("drain", async () => {
  if (sleep_time) {
    await sleep(sleep_time)
  }
  $.send("drain", { message: "Queue is drain, run handling again" })
  // processUser() // TODO: Тут логіка не така. Тут тепер треба зробити на новому сервісі що відправляє месседжі, що якщо чує drain, то знову відправляє пул юзерів. Але питання в тому як зрозуміти що опрацювання завершилось. Тому що кожен юзер залітає окремим повідомленням. Можливо таймером, типу якщо 2 секунди ніхто не залітає, значить drain. Або кращий варіант дивитись queue, якщо вона прям пуста, то drain
  // getArchiveOrSubgraphUsers(protocol, queue)
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
    // queue.add(user)  // TODO Do I need queue ??? because this part of concurency
  }
})

fetcher.once("fetcherReady", data => {
  sendStartEvent({ message: `All data ready, user processing has started` })
  // getArchiveOrSubgraphUsers(protocol, queue) // TODO Find out wnen this started. If nothing started - this is entry point
})

/**
 * Listeners
 */
$.on(`onReservesData`, data => {
  fetcher.setGlobalReservesData(data)
})
let i = 0
$.on("parseUser", async data => {
  // TODO походу треба зробити щоб processUser залітав в queue. Тому що по суті буде 30 000 запусків processUser в черзі, а в середині кожного запуску буде залітати в чергу, що по суті не дає ніяких переваг
  await processUser(data)
  console.log(`======================= parseUser ${i} ===================`)
  i++
  // getArchiveOrSubgraphUsers(protocol, queue)
  // TODO Переробити його, щоб взагалі не було getArchiveOrSubgraphUsers, а дані чисто залітали по mqtt
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

    const checkBlacklistUser = await checkUserInBlacklist(user, protocol)
    if (!checkBlacklistUser) {
      queue.add(user)
    }
  } catch (error) {
    console.error("Error reading allUsers.json:", error)
  }
}

process.on("uncaughtException", error => {
  console.error(error)
  fetcher.emit("errorMessage", error)
})
