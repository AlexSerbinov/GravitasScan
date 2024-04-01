const { getFetcher } = require("../lib/services/archive/fetcher")
const { getLatestRedisBlock, saveUsersToArchive } = require("../lib/services/archive/utils")
const { configurePool } = require("../lib/ethers/pool")
const redis = require("../lib/redis/redis/lib/redis")

const { protocol } = $.params
const configPath = $.params.configPath
const config = require(`${process.cwd()}${configPath}`)

await redis.prepare(config.REDIS_HOST, config.REDIS_PORT)

// Service initialization
const connectionChecker = require("../lib/services/connections") //TODO @AlexSerbinov - fix
const { SERVICE_STATUS } = require("../lib/constants") //TODO @AlexSerbinov - remove

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

$.send("start", { message: `${protocol} archive starting at ${new Date().toLocaleString("en-US")}` })

/**
 * Handle status of node
 */
const nodeActive = await connectionChecker.checkNodeConnection() 
if (!nodeActive) {
  fetcher.emit("error", { message: `${protocol} archive terminating` })
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
    $.send("start", { message: `Run fetching , For listen users connect to mqtt channel -logger/liquidator/${protocol}-` }) //TODO @AlexSerbinov change to real mqtt channel from the params
  }
})

/**
 * Handle events from fetcher
 */
fetcher.on("fetch", async data => {
  const { users, toBlock } = data
  await saveUsersToArchive(protocol, toBlock, users, "archive_users")
  $.send("sendFetchedUsersEvent", users)
  const date = new Date().toUTCString()
  $.send("archive_logs", { date, ...data })  
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

$.send("start", { message: `${protocol} archive started!` })

/**
 * Handle process exit
 */
$.onExit(async () => {
  await db.setServiceStatus("archive", [protocol], [SERVICE_STATUS.OFF]) ////TODO @AlexSerbinov fix
  return new Promise(resolve => {
    setTimeout(() => {
      const { pid } = process
      console.log(pid, "Ready to exit.")
      $.send("stop", { date })
      resolve()
    }, 100) //TODO @AlexSerbinov move to configs // Small timeout to ensure async cleanup completes
  })
})

// Handle uncaught exceptions
process.on("uncaughtException", error => {
  $.send("errorMessage", {
    service: name, //TODO @AlexSerbinov add name
    protocol: 'all',   //TODO @AlexSerbinov add protocol
    ev: 'errorMessage', 
    data: error //this is your message
    })
})