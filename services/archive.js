const defaultSettings = require("../configs/DefaultSettings.json")

const { onBlock, sendFetchedUsersEvent, sendStartEvent } = require("../lib/mq")
const { getFetcher } = require("../lib/services/archive/fetcher")
const { getLatestDbBlock, saveUsersToArchive } = require("../lib/services/archive/utils")
const { configurePool } = require("../lib/ethers/pool")

const { protocol } = $.params

const { startArchive } = require("../lib/services/archive")
const connectionChecker = require("../lib/services/connections") // TODO maybe also remove this if we decide not to use db
const db = require("../lib/db") // TODO maybe also remove this if we decide not to use db
const { SERVICE_STATUS } = require("../lib/constants")
const { sendErrorEvent, sendStartEvent } = require("../lib/services/archive/mq") // TODO remove this

const configPath = $.params.configPath
const config = require(`${process.cwd()}${configPath}`) // Load the configuration

const service = "subgraph"

/**
 * Service initial data
 */
configurePool([config.RPC_WSS])

// We prepare redis here because only in this place we have config params. And we don't want to use global variables.

const settings = defaultSettings.find(s => s.protocol === protocol).services[service]

const fetcher = getFetcher(protocol)

async function start() {
  console.log("started")
  $.send("start", { message: `${protocol} archive starting at ${new Date().toLocaleString("en-US")}` })

  const [dbActive, dbSynced, nodeActive] = await Promise.all([
    await connectionChecker.checkDBConnection(),
    await connectionChecker.syncDBArchive(),
    await connectionChecker.checkNodeConnection(),
  ])

  if (!dbActive || !nodeActive) {
    sendErrorEvent({ message: `${protocol} archive terminating` })
    setImmediate(() => {
      process.exit(1)
    })
  }

  startArchive(protocol)
}

/**
 * Init
 */
const startArchive = async protocol => {
  const archiveBlockDiff = config.ARCHIVE_BLOCKS_DIFF || 10

  /**
   * Create fetcher instance by protocol
   */
  const fetcher = getFetcher(protocol)

  $.send("start", { message: `Run fetching -archive_users-, For listen users connect to mqtt channel -event:archive_users:archive:${protocol}-` })

  /**
   * Get latest archive block
   */
  let latestArchiveBlock = await getLatestDbBlock(protocol)

  /**
   * Listen latest db block from network
   */
  onBlock(data => {
    const { number } = data
    /**
     * Start fetching
     */
    if (!fetcher.inProgress && number - latestArchiveBlock > archiveBlockDiff) {
      fetcher.start(latestArchiveBlock, number)
      sendStartEvent({
        message: `${protocol} archive start fetching users from ${latestArchiveBlock} to ${number} block`,
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
  })



  fetcher.on("finished", data => {
    const { latestBlock } = data
    latestArchiveBlock = latestBlock
  })
}

start(a => {
  console.log(`======================= started ===================`)
}).catch(e => {
  sendErrorEvent({ message: `${protocol} archive error`, error: e })
  db.sequelize.close().then(() => process.exit(1))
})

gracefulShutdown(async () => {
  await db.setServiceStatus("archive", [protocol], [SERVICE_STATUS.OFF])
})

$.send("start", { message: `Run in ${mode} mode` })
$.send("start", { message: `${protocol} subgraph started!` })
console.log(`SUBRAPH: started!`)

//Output point
fetcher.on("fetch", data => {
  $.send("sendDataToSearcher", data)
  const date = new Date().toUTCString()
  $.send("subgraph_logs", { date, ...data })
})

/**
 * Listeners
 */
$.on(`onReservesData`, data => {
  fetcher.setGlobalReservesData(data)
})

$.onExit(async () => {
  await db.setServiceStatus("archive", [protocol], [SERVICE_STATUS.OFF])
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
