"use strict"
const { Fetcher } = require("./fetcher")
const TroveManagerABI = require("../../../artifacts/liquity/TroveManagerABI")
const { PROTOCOLS_CONFIG } = require("../../../constants")
const { ethers, BigNumber } = require("ethers")
const { getProvider } = require("../../../ethers/pool")

class FetcherLiquity extends Fetcher {
  /**
   * @param {*} settings - object that contains
   * services settings
   */
  constructor(settings) {
    super(settings)
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
  async filterUserByLiqFilters(user) {
    /**
     * Prepare params
     */
    const { globalReservesData, settings } = this
    const { minHfDel, minHfLiq, maxHfDel, maxHfLiq } = settings

    /**
     * Get data
     */
    const provider = getProvider()
    const contract = this.getContract(provider)
    const { coll, debt } = await contract.Troves(user)
    const { price, decimals } = globalReservesData["eth"]
    const ethPrice = BigNumber.from(price).div(BigNumber.from(10 ** decimals))

    /**
     * Delete if no balance
     */
    const zero = BigNumber.from(0)
    if (!debt.gt(zero)) return { user, del: true, coll, reason: "No borrow" }

    if (!coll.gt(zero)) return { user, del: true, debt, reason: "No collateral" }

    /**
     * Check hf
     */
    const hf = ethPrice.mul(coll.div(debt))
    if (hf < minHfDel) return { user, del: true, reason: "low hf" }

    if (hf > maxHfDel) return { user, del: true, reason: "High hf" }

    /**
     * Check is user valid to liquidate
     */
    if (hf < minHfLiq || hf > maxHfLiq) {
      /**
       * If not - back him to watchlist
       */
      return { user, watch: true }
    } else {
      return {
        user,
        health_factor: hf,
        liq: true,
      }
    }
  }

  /**
   * Get liquity throw contract
   * @returns {@ethers/Contract}
   */
  getContract(provider) {
    return new ethers.Contract(PROTOCOLS_CONFIG.Liquity.TROVE_MANAGER, TroveManagerABI, provider)
  }
}

module.exports = { FetcherLiquity }
