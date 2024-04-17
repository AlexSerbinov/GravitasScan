const { getFetcher } = require("../lib/services/archive/fetcher")
const { getLatestRedisBlock, saveUsersToArchive } = require("../lib/services/archive/utils")
const { configurePool } = require("../lib/ethers/pool")
const redis = require("../lib/redis/redis/lib/redis")
const { PROTOCOLS_CONFIG } = require("../lib/constants/index")
const connectionChecker = require("../lib/utils/connections")

/**
 * @param {string} protocol - The name of the lending protocol (e.g., "V1", "V2", "V3" "Compound")
 *
 * @param {string} configPath - Path to the configuration file Main.json, that contains necessary settings and parameters for the service.
 * This file includes configurations such as database connections, service endpoints, and other operational parameters.
 *
 * @param {string} service - The name of the service (e.g., "subgraph", "dataFetcher", "TransmitFetcher" "Proxy", "Archive", etc.)
 *
 */
const { protocol, service, configPath } = $.params

/**
 * @param {number} CREATED_AT_BLOCK - The block number at which the protocol was created.
 * This is used for scanning users from the latest block back to the block when the protocol was created.
 */
const CREATED_AT_BLOCK = PROTOCOLS_CONFIG[protocol].CREATED_AT_BLOCK

const config = require(`${process.cwd()}${configPath}`)

/**
 * Service initialization
 */
await redis.prepare(config.REDIS_HOST, config.REDIS_PORT)

/**
 * Configure the Ethereum connection pool
 * @param {number} archiveBlockDiff - time buffer to proccess block logs efficiently
 */
configurePool([config.RPC_WSS])
const archiveBlockDiff = config.ARCHIVE_BLOCKS_DIFF || 10
let latestArchiveBlock = (await getLatestRedisBlock(protocol)) || CREATED_AT_BLOCK
console.log(`latest block stored to archive: ${latestArchiveBlock}`)
$.send("info", {
  service,
  protocol,
  ev: "info",
  data: `latest block stored to archive: ${latestArchiveBlock}`, // look workers/archiveServices.json start event
})

/**
 * Initialize fetcher instance
 */
const fetcher = getFetcher(protocol)

$.send("start", {
  service,
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
    service,
    protocol,
    ev: "error_message",
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
    $.send("info", {
      service,
      protocol,
      ev: "info",
      data: `New block ${JSON.stringify(number)} recived`, // look workers/archiveServices.json start event
    })
  }
})

/**
 * Handle events from fetcher
 */
fetcher.on("fetch", async data => {
  const { users, toBlock } = data
  await saveUsersToArchive(protocol, toBlock, users, "archive_users")
  $.send("sendFetchedUsersEvent", {
    service,
    protocol,
    ev: "sendFetchedUsersEvent",
    data: users,
  })
})

/**
 * Set global reserves data listener
 */
$.on(`onReservesData`, data => {
  fetcher.setGlobalReservesData(data)
})

/**
 * Set the last archive block, called when process of scanning in particular protocol is finished
 */
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
