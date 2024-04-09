const { configurePool } = require("../lib/ethers/pool")

const { createBlockWatcher } = require("../lib/services/events/watcher-block")
const {
  createWatcherV1,
  createWatcherV2,
  createWatcherV3,
  createWatcherCompound,
  createWatcherLiquity,
  createWatcherMakerDao,
} = require("../lib/services/events/reserves")
const { EventEmitter } = require("node:events")

/**
 * @param {string} protocol - The name of the lending protocol (e.g., "V1", "V2", "V3" "Compound")
 *
 * @param {string} configPath - Path to the configuration file Main.json, that contains necessary filters and parameters for the service.
 * This file includes configurations such as database connections, service endpoints, and other operational parameters.
 *
 * @param {string} service - The name of the service (e.g., "subgraph", "dataFetcher", "TransmitFetcher" "Proxy", "Archive", etc.)
 */
const { protocol, configPath, service, WATCHER_RESERVES_INTERVAL, WATCHER_INTERVAL } = $.params

/**
 * Now we save the path for config params for each protocol in [serviceName]service.json file.
 */
const config = require(`${process.cwd()}${configPath}`)

configurePool([config.RPC_WSS])

/**
 * Block watcher
 */
const blockWatcher = createBlockWatcher()
  .onBlock(number => {
    $.send("sendBlock", { number, chain: "eth" })
  })
  .onError(e => sendErrorEvent(e))

/**
 * Reserves watcher
 */
// const reservesV1 = createWatcherV1()
//   .onReserves(data => {
//     $.send("sendGlobalReservesV1", data)
//   })
//   .onError(e => sendErrorEvent(e, "V1"))

// const reservesV2 = createWatcherV2()
//   .onReserves(data => {
//     $.send("sendGlobalReservesV2", data)
//   })
//   .onError(e => sendErrorEvent(e, "V2"))

// const reservesV3 = createWatcherV3()
//   .onReserves(data => {
//     $.send("sendGlobalReservesV3", data)
//   })
//   .onError(e => sendErrorEvent(e, "V3"))

// const reservesCompound = createWatcherCompound()
//   .onReserves(data => {
//     $.send("sendGlobalReservesCompound", data)
//   })
//   .onError(e => sendErrorEvent(e, "Compound"))

// const watcherLiquity = createWatcherLiquity()
//   .onReserves(data => {
//     $.send("sendGlobalReservesLiquity", data)
//   })
//   .onError(e => sendErrorEvent(e, "Liquity"))

// const watcherMakerDao = createWatcherMakerDao()
//   .onReserves(data => {
//     $.send("sendGlobalReservesMakerDAO_CDP", data)
//   })
//   .onError(e => sendErrorEvent(e, "MakerDAO_CDP"))

/**
 * Reserves watcher trigger
 */
const reservesTrigger = new EventEmitter()

/**
 * Start app
 */
const start = async () => {
  /**
   * Emit 'update' event to reserves trigger by interval
   */
  setInterval(() => {
    reservesTrigger.emit("update")
  }, WATCHER_RESERVES_INTERVAL)

  /**
   * Start block watcher
   */
  blockWatcher.start(WATCHER_INTERVAL)

  /**
   * Start reserves watchers
   */
//   reservesV1.start(reservesTrigger)
//   reservesV2.start(reservesTrigger)
//   reservesV3.start(reservesTrigger)
//   reservesCompound.start(reservesTrigger)
//   watcherLiquity.start(reservesTrigger)
//   watcherMakerDao.start(reservesTrigger)
//   $.send("start", {
//     service,
//     protocol: "All",
//     ev: "start",
//     data: "All event watchers started",
//   })
}
start()

/**
 * Stop app
 */
const stop = () => {
  blockWatcher.stop()
  reservesV1.stop()
  reservesV2.stop()
  reservesV3.stop()
  reservesCompound.stop()
  $.send("stop", {
    service,
    protocol: "All",
    ev: "stop",
    data: "All event watchers stopped",
  })
}

module.exports = { start, stop }

/**
 * Handle process exit
 */
$.onExit(async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      const { pid } = process
      stop()
      console.log(pid, "Ready to exit.")
      const date = new Date().toUTCString()
      $.send("stop", {
        service,
        protocol,
        ev: "stop",
        data: date,
      })
      resolve()
    }, 150) // Small timeout to ensure async cleanup completes
  })
})

const sendErrorEvent = (error, protocol) => {
  $.send("errorMessage", {
    service,
    protocol,
    ev: "errorMessage",
    data: error,
  })
}
// Handle uncaught exceptions
process.on("uncaughtException", error => {
  $.send("errorMessage", {
    service,
    protocol: "All",
    ev: "errorMessage",
    data: error,
  })
})
