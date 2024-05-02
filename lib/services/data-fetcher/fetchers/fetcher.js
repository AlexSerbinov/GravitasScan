"use ctrict"
const { EventEmitter } = require("node:events")

/**
 * Abstract fetcher
 *
 * To request user data
 */
class Fetcher extends EventEmitter {
  /**
   * @param {*} settings - object that contains
   * services settings
   * @param {*} config - config object with all settings variables
   */
  constructor(settings) {
    super()
    this.settings = settings
    this.globalReservesData = null
  }

  /**
   * Update global reserves through
   * this method
   * @param {*} data - global reserves
   * @returns {Fetcher}
   */
  setGlobalReservesData(data) {
    this.globalReservesData = data
    return this
  }

  /**
   * Fetch user reserves data
   * and make decision what to do next:
   *
   * - Liquidate
   * - Watch longer
   * - Forget
   *
   * @param {string} user - user address
   */
  async fetchData({ user }) {
    if (!this.globalReservesData) {
      return
    }
    if (!user || typeof user !== "string") {
      this.emit("reject", user)
      return
    }

    const resp = await this.filterUserByLiquidationFilters(user).catch(error => {
      this.emit("error", { error, user })
    })

    const { del, liq, watch } = resp
    if (del) this.emit("deleteFromRedis", resp)
    if (liq) this.emit("liquidate", resp)
    if (watch) this.emit("pushToRedis", resp)
  }

  /**
   * Implement execution in the child class
   */
  filterUserByLiquidationFilters() {
    throw new Error("Method not implemented.")
  }
}

module.exports = { Fetcher }
