const { getFetcher } = require("../lib/services/archive/fetcher")
const { getLatestDbBlock, saveUsersToArchive } = require("../lib/services/archive/utils")
const { configurePool } = require("../lib/ethers/pool")

// Retrieve configuration settings
const { protocol } = $.params
const configPath = $.params.configPath
const config = require(`${process.cwd()}${configPath}`) // Load the configuration
Object.assign(process.env, config) // While we use DB it's a simplest method to export config to other modules. After switching to redis we can remove this line

// Service and database initialization
const connectionChecker = require("../lib/services/connections")
const db = require("../lib/db")
const { SERVICE_STATUS } = require("../lib/constants")

/**
 * Configure the Ethereum connection pool
 */
configurePool([config.RPC_WSS])

/**
 * Initialize fetcher instance
 */
const fetcher = getFetcher(protocol)

// Start the archive process
console.log("started")
$.send("start", { message: `${protocol} archive starting at ${new Date().toLocaleString("en-US")}` })

// Check database and node connections asynchronously
const [dbActive, dbSynced, nodeActive] = await Promise.all([
  connectionChecker.checkDBConnection(),
  connectionChecker.syncDBArchive(),
  connectionChecker.checkNodeConnection(),
])

// Handle inactive database or node
if (!dbActive || !nodeActive) {
  fetcher.emit("error", { message: `${protocol} archive terminating` })
  setImmediate(() => {
    process.exit(1)
  })
}

/**
 * Initialize the archive process
 */
const archiveBlockDiff = config.ARCHIVE_BLOCKS_DIFF || 10

// Get the latest archive block
let latestArchiveBlock = await getLatestDbBlock(protocol)

/**
 * Listen for new blocks and trigger fetching
 */
fetcher.on("onBlock", data => {
  const { number } = data
  // Start fetching if conditions are met
  if (!fetcher.inProgress && number - latestArchiveBlock > archiveBlockDiff) {
    fetcher.start(latestArchiveBlock, number)
    $.send("start", { message: `Run fetching -archive_users-, For listen users connect to mqtt channel -event:archive_users:archive:${protocol}-` })
  }
})

/**
 * Handle events from fetcher
 */
fetcher.on("fetch", async data => {
  const { users, toBlock } = data
  await saveUsersToArchive(protocol, toBlock, users, "archive_users")
  $.send("sendFetchedUsersEvent", users)
})

fetcher.on("finished", data => {
  latestArchiveBlock = data.latestBlock
})

$.send("start", { message: `${protocol} archive started!` })
console.log(`ARCHIVE: started!`)

// Output point for fetcher data
fetcher.on("fetch", data => {
  $.send("sendDataToSearcher", data)
  const date = new Date().toUTCString()
  $.send("subgraph_logs", { date, ...data })
})

/**
 * Set global reserves data listener
 */
$.on(`onReservesData`, data => {
  fetcher.setGlobalReservesData(data)
})

/**
 * Handle process exit
 */
$.onExit(async () => {
  await db.setServiceStatus("archive", [protocol], [SERVICE_STATUS.OFF])
  return new Promise(resolve => {
    setTimeout(() => {
      const { pid } = process
      console.log(pid, "Ready to exit.")
      $.send("stop", { date })
      resolve()
    }, 100) // Small timeout to ensure async cleanup completes
  })
})

// Handle uncaught exceptions
process.on("uncaughtException", error => {
  console.error(error)
  $.send("errorMessage", { message: error })
})
