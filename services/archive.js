const { getFetcher } = require("../lib/services/archive/fetcher")
const { getLatestRedisBlock, saveUsersToArchive } = require("../lib/services/archive/utils")
const { configurePool } = require("../lib/ethers/pool")
const redis = require("../lib/redis/redis/lib/redis")

const { protocol } = $.params
const configPath = $.params.configPath
const config = require(`${process.cwd()}${configPath}`)

await redis.prepare(config.REDIS_HOST, config.REDIS_PORT)

// Service initialization
const connectionChecker = require("../lib/utils/connections")
/**
 * Configure the Ethereum connection pool
 * @param {number} archiveBlockDiff - time buffer to proccess block logs efficiently
 */
configurePool([config.RPC_WSS])
const archiveBlockDiff = config.ARCHIVE_BLOCKS_DIFF || 10
let latestArchiveBlock = await getLatestRedisBlock(protocol)

/**
 * Initialize fetcher instance
 */
const fetcher = getFetcher(protocol)

$.send("start", {
  service: "archive",
  protocol,
  ev: "start",
  data: { message: `${protocol} archive starting at ${new Date().toLocaleString("en-US")}` },
})

/**
 * Handle status of node
 */
const nodeActive = await connectionChecker.checkNodeConnection()
if (!nodeActive) {
  $.send("errorMessage", {
    service: "archive",
    protocol,
    ev: "errorMessage",
    data: `archive terminating`,
  })
  setImmediate(() => {
    process.exit(1)
  })
}

/**
 * Listen for new blocks and trigger fetching.
 * If we're still parsing previous blocks, parsing for the new ones won't begin.
 * @param {*} number - latestBlock from the provider (fetched by events.js)
 */

$.on("onBlock", data => {
  const { number } = data
  if (!fetcher.inProgress && latestArchiveBlock && number - latestArchiveBlock > archiveBlockDiff) {
    fetcher.start(latestArchiveBlock, number)
    $.send("start", {
      service: "archive",
      protocol,
      ev: "start",
      data: `Run fetching , For listen users connect to mqtt channel ${$.__notify.start.topic}`, // look workers/archiveServices.json start event
    })
  }
})

/**
 * Handle events from fetcher
 */
fetcher.on("fetch", async data => {
  const { users, toBlock } = data
  await saveUsersToArchive(protocol, toBlock, users, "archive_users")
  $.send("sendFetchedUsersEvent", users)
  $.send("infsendFetchedUsersEvento", {
    service: "archive",
    protocol,
    ev: "sendFetchedUsersEvent",
    data: users,
  })
  $.send("info", {
    service: "archive",
    protocol,
    ev: "info",
    data: data,
  })
})

/**
 * Set global reserves data listener
 */
$.on(`onReservesData`, data => {
  fetcher.setGlobalReservesData(data)
})

fetcher.on("finished", data => {
  latestArchiveBlock = data.latestBlock
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
        service: "archive",
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
    service: "archive",
    protocol,
    ev: "errorMessage",
    data: error,
  })
})
