"use strict"
const { Fetcher } = require("./fetcher")
const { BigNumber } = require("ethers")
const { getProvider } = require("../../../ethers/pool")

// Import constants from config/const.js
const { USER_SKIPPED_BY_FILTERS } = require("../../../../configs/eventTopicsConstants")

/**
 * Abstract fetcher for AAVE contract users
 */
class FetcherAave extends Fetcher {
  /**
   * @param {*} settings - object that contains
   * services settings
   * @param {*} config - config object with all settings variables
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
  async execute(user) {
    /**
     * Prepare params
     */

    const { globalReservesData, settings } = this
    const { minHfDel, minHfLiq, maxHfDel, maxHfLiq, minBorrow, minCollateral } = settings

    /**
     * Get data
     */
    const provider = getProvider()
    const contract = this.getContract(provider)

    const { healthFactor, reserves } = await contract.getUserReserves(user)
    const hf = await this.calculateHealthFactor(healthFactor, user, provider)

    const rawAssets = reserves ? Object.keys(reserves) : []
    const assets = this.getAssets(rawAssets)

    /**
     * Check hf
     */
    if (hf < minHfDel) {
      if (hf > minHfDel * 0.25) {
        // only for reduce loggs purpose
        this.emit("info", `user: ${user} [ del: true] |  HF: ${hf} , minHF: ${minHfDel}`, USER_SKIPPED_BY_FILTERS)
      }
      return { user, del: true, hf, reason: "low hf", assets }
    }
    if (hf > maxHfDel) {
      if (hf < maxHfDel * 2) {
        // only for reduce loggs purpose
        this.emit("info", `user: ${user} [ del: true] |  HF: ${hf}  maxHF /${maxHfDel}`, USER_SKIPPED_BY_FILTERS)
      }
      return { user, del: true, hf, reason: "High hf", assets }
    }
    /**
     * Analyze data
     */
    const collateral = {
      addresses: [],
      amounts: [],
    }

    const borrow = {
      addresses: [],
      amounts: [],
    }

    /**
     * Check reserves
     */
    for (const name in reserves) {
      const reserve = reserves[name]
      const { collateralBalance, borrowBalance } = reserve
      const { price, decimals } = globalReservesData[name]
      const ethPrice = BigNumber.from(price) / 10 ** 18
      const ethCollateral = (collateralBalance / 10 ** BigNumber.from(decimals)) * ethPrice
      const ethBorrow = (borrowBalance / 10 ** BigNumber.from(decimals)) * ethPrice

      if (ethCollateral >= minCollateral) {
        collateral.addresses.push(name)
        collateral.amounts.push(collateralBalance.toString())
      }

      if (ethBorrow >= minBorrow) {
        borrow.addresses.push(name)
        borrow.amounts.push(borrowBalance.toString())
      }
    }

    /**
     * Check amount
     */
    if (collateral.addresses.length === 0) {
      this.emit("info", `user: ${user} [skipped] | no collateral`, USER_SKIPPED_BY_FILTERS)
      return { user, del: true, hf, borrow, reason: "No collateral", assets }
    }
    if (borrow.addresses.length === 0) {
      this.emit("info", `user: ${user} [skipped] | no borrow`, USER_SKIPPED_BY_FILTERS)
      return { user, del: true, hf, collateral, reason: "No borrow", assets }
    }
    /**
     * Check is user valid to liquidate
     */
    if (hf < minHfLiq || hf > maxHfLiq) {
      /**
       * If not - back him to watch list
       */
      this.emit("info", `user: ${user} [watch] |  HF: ${hf} , minHF: ${minHfLiq} maxHF: ${maxHfLiq}`, USER_SKIPPED_BY_FILTERS)
      return { user, hf, collateral, borrow, watch: true, assets }
    } else {
      return {
        user,
        health_factor: hf,
        reserve_addresses: borrow.addresses,
        reserve_amounts: borrow.amounts,
        collateral_addresses: collateral.addresses,
        collateral_amounts: collateral.amounts,
        liq: true,
      }
    }
  }

  async calculateHealthFactor(healthFactor, user, provider) {
    return healthFactor / 10 ** 18
  }

  getAssets(rawAssets) {
    return rawAssets
  }

  getContract() {
    throw new Error("Method not implemented.")
  }
}

module.exports = { FetcherAave }
