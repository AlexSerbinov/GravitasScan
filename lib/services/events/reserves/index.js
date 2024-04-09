const { WatcherReserves } = require('./watcher-reserves')
const { WatcherReservesV1 } = require('./watcher-reserves-v1')
const { WatcherReservesV2 } = require('./watcher-reserves-v2')
const { WatcherReservesV3 } = require('./watcher-reserves-v3')
const { WatcherReservesCompound } = require('./watcher-reserves-compound')
const { WatcherReservesLiquity } = require('./watcher-liquity')
const { WatcherReservesMakerDao } = require('./watcher-reserves-maker-dao')

/**
 * Factories
 * @returns {WatcherReserves}
 */
const createWatcherV1 = () => new WatcherReservesV1()
const createWatcherV2 = () => new WatcherReservesV2()
const createWatcherV3 = () => new WatcherReservesV3()
const createWatcherCompound = () => new WatcherReservesCompound()
const createWatcherLiquity = () => new WatcherReservesLiquity()
const createWatcherMakerDao = () => new WatcherReservesMakerDao()

module.exports = {
  WatcherReserves, WatcherReservesV1,
  WatcherReservesV2, WatcherReservesV3, WatcherReservesCompound, WatcherReservesLiquity, WatcherReservesMakerDao,
  createWatcherV1, createWatcherV2, createWatcherV3, createWatcherCompound,
  createWatcherLiquity, createWatcherMakerDao
}
