"use strict"
const { WatcherReserves } = require("./watcher-reserves")
const { createHelperV3 } = require("../../../helpers/onchain-aggr-V1")

class WatcherReservesV3 extends WatcherReserves {
  /**
   * Get aave helper contract
   * @returns {HelperV3}
   */
  getContract() {
    const provider = this.getProvider()
    return createHelperV3(provider)
  }
}

module.exports = { WatcherReservesV3 }
