'use strict'
const { WatcherReserves } = require('./watcher-reserves')
const { createHelperV1 } = require('../../../helpers/onchain-aggr-V1') 

class WatcherReservesV1 extends WatcherReserves {

  /**
   * Get aave helper contract
   * @returns {HelperV1}
   */
  getContract() {
    const provider = this.getProvider()
    return createHelperV1(provider)
  }
}

module.exports = { WatcherReservesV1 }
