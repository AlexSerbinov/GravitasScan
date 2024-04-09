'use strict'
const { WatcherReserves } = require('./watcher-reserves')
const { createHelperCompound } = require('../../../helpers/onchain-aggr-V1') 

class WatcherReservesCompound extends WatcherReserves {

  /**
   * Get aave helper contract
   * @returns {HelperCompound}
   */
  getContract() {
    const provider = this.getProvider()
    return createHelperCompound(provider)
  }
}

module.exports = { WatcherReservesCompound }
