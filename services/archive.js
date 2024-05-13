const { getFetcher } = require("../lib/services/archive/fetcher")
const { getLatestRedisBlock, saveUsersToArchive, getUsersCount } = require("../lib/services/archive/utils")
const { configurePool } = require("../lib/ethers/pool")
const redis = require("../lib/redis/redis/lib/redis")
const { PROTOCOLS_CONFIG } = require("../lib/constants/index")
const connectionChecker = require("../lib/utils/connections")

const { START, STOP, INFO, ERROR_MESSAGE, ARCHIVE_SYNCRONIZATION_FINISHED, USERS_SAVED_TO_ARCHIVE, NEW_BLOCK_RECEIVED, LATEST_STORED_BLOCK, NUMBER_OF_STORED_USERS } = require("../configs/eventTopicsConstants")

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

/**
 * Initialize fetcher instance
 */
const fetcher = getFetcher(protocol)

/**
 * Log current state
 */

const logCurrentArchiveStatus = async () => {
  let archiveUsersCount = await getUsersCount(protocol)
  fetcher.emit("info", `In archive stored ${archiveUsersCount} users}`, NUMBER_OF_STORED_USERS)
  fetcher.emit("info", `latest block stored to archive: ${latestArchiveBlock}`, INFO)
}
logCurrentArchiveStatus()

console.log(`${service} started`)
$.send("start", {
  service,
  protocol,
  ev: START,
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
    ev: ERROR_MESSAGE,
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
    fetcher.emit("info", `Received new block ${number}`, NEW_BLOCK_RECEIVED)
    fetcher.emit("info", `Latest block stored in archive: ${latestArchiveBlock}`, LATEST_STORED_BLOCK)
  }
})

/**
 * Handle events from fetcher
 */
fetcher.on("fetch", async data => {
  const { users, toBlock } = data
  await saveUsersToArchive(protocol, toBlock, users, "archive_users")
  fetcher.emit("info", `users saved to archive: ${data.users?.length}, scanned preriod until block: ${data?.toBlock} | saved users to archive: ${JSON.stringify(users)}`, USERS_SAVED_TO_ARCHIVE)
  let archiveUsersCount = await getUsersCount(protocol)
  fetcher.emit("info", `In archive stored ${archiveUsersCount} users`, NUMBER_OF_STORED_USERS)
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
fetcher.on("finished", async data => {
  latestArchiveBlock = data.latestBlock
  fetcher.emit("info", `Scaning Finished: Latest Stored Archive Block: ${latestArchiveBlock}`, ARCHIVE_SYNCRONIZATION_FINISHED)
  let archiveUsersCount = await getUsersCount(protocol)
  fetcher.emit("info", `In archive stored ${archiveUsersCount} users`, NUMBER_OF_STORED_USERS)
})

/**
 * Used for sending logs from other parths of protocol
 */
fetcher.on("info", (data, ev = "info") => {
  // console.log(`\nevent = ${ev}`)
  // console.log(data, `\n`)
  $.send("info", {
    service,
    protocol,
    ev,
    data: JSON.stringify(data),
  })
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
        ev: STOP,
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
    ev: ERROR_MESSAGE,
    data: error,
  })
})
