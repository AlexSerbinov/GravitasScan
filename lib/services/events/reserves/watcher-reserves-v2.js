"use strict"
const { WatcherReserves } = require("./watcher-reserves")
const { createHelperV2 } = require("../../../helpers/onchain-aggr-V1")

class WatcherReservesV2 extends WatcherReserves {
  /**
   * Get aave helper contract
   * @returns {HelperV2}
   */
  getContract() {
    const provider = this.getProvider()
    return createHelperV2(provider)
  }
}

module.exports = { WatcherReservesV2 }
