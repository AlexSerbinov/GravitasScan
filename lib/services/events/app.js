'use strict'
const {
  sendStartEvent,
  sendStopEvent,
  sendErrorEvent,
  sendBlock,
  sendGlobalReserves
} = require('./mq')

const { createBlockWatcher } = require('./watcher-block')
const { createWatcherV1, createWatcherV2,
  createWatcherV3, createWatcherCompound, createWatcherLiquity, createWatcherMakerDao } = require('./reserves')
const { EventEmitter } = require('node:events')
const {configurePool} = require("../../ethers/pool")

configurePool([process.env.RPC_WSS])
/**
 * Block watcher
 */
const blockWatcher = createBlockWatcher()
  .onBlock(number => {
    sendBlock({ number, chain: 'eth' })
  })
  .onError(e => sendErrorEvent(e))

/**
 * Reserves watcher
 */
const reservesV1 = createWatcherV1()
  .onReserves(data => {
    sendGlobalReserves('V1', data)
  })
  .onError(e => sendErrorEvent(e, 'V1'))

/**
 * Reserves watcher
 */
const reservesV2 = createWatcherV2()
  .onReserves(data => {
    sendGlobalReserves('V2', data)
  })
  .onError(e => sendErrorEvent(e, 'V2'))

/**
 * Reserves watcher
 */
const reservesV3 = createWatcherV3()
  .onReserves(data => {
    sendGlobalReserves('V3', data)
  })
  .onError(e => sendErrorEvent(e, 'V3'))

/**
 * Reserves watcher
 */
const reservesCompound = createWatcherCompound()
  .onReserves(data => {
    sendGlobalReserves('Compound', data)
  })
  .onError(e => sendErrorEvent(e, 'Compound'))

/**
 * Reserves watcher
 */
const watcherLiquity = createWatcherLiquity()
  .onReserves(data => {
    sendGlobalReserves('Liquity', data)
  })
  .onError(e => sendErrorEvent(e, 'Liquity'))

/**
* Reserves watcher
*/
const watcherMakerDao = createWatcherMakerDao()
  .onReserves(data => {
    sendGlobalReserves('MakerDAO_CDP', data)
  })
  .onError(e => sendErrorEvent(e, 'MakerDAO_CDP'))

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
    reservesTrigger.emit('update')
  }, process.env.WATCHER_RESERVES_INTERVAL)

  /**
   * Start block watcher
   */
  blockWatcher.start(process.env.WATCHER_INTERVAL)

  /**
   * Start reserves watchers
   */
  reservesV1.start(reservesTrigger)
  reservesV2.start(reservesTrigger)
  reservesV3.start(reservesTrigger)
  reservesCompound.start(reservesTrigger)
  watcherLiquity.start(reservesTrigger)
  watcherMakerDao.start(reservesTrigger)
  sendStartEvent()
}

/**
 * Stop app
 */
const stop = () => {
  blockWatcher.stop()
  reservesV1.stop()
  reservesV2.stop()
  reservesV3.stop()
  reservesCompound.stop()
  sendStopEvent()
}

module.exports = { start, stop }
