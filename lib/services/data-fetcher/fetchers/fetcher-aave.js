"use strict"
const { Fetcher } = require("./fetcher")
const { BigNumber } = require("ethers")
const { getProvider } = require("../../../ethers/pool")

/**
 * import events logger constants from loggerTopicsConstants
 */
const { USER_SKIPPED_BY_LOW_HF, USER_SKIPPED_BY_HIGH_HF, USER_SKIPPED_BY_HF, USER_SKIPPED_BY_LOW_COLLATERAL, USER_SKIPPED_BY_LOW_BORROW } = require("../../../../configs/loggerTopicsConstants")

/**
 * @param {*} filters - object that contains { minHF, maxHF, minBorrow ...}
 * @param {*} config - all configs settings from Main.json
 * @param {*} params - params object from [protocol]filters.json param field
 * @param {*} simulator - enso simulator instance
 */
class FetcherAave extends Fetcher {
  constructor(filters, config, params, simulator) {
    super(filters, config, params, simulator)
    this.params = params
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
  async filterUserByLiquidationFilters(user) {
    /**
     * Prepare params
     */
    const { globalReservesData, filters } = this
    const { minHfDel, minHfLiq, maxHfDel, maxHfLiq, minBorrow, minCollateral } = filters

    /**
     * Get data
     */
    const provider = getProvider()
    const contract = this.getContract(provider)

    let healthFactor
    let reserves
    let data
    if (this.params.useSimulatorInsteadOfNode) {
      data = await contract.getUserReserves(user)
      healthFactor = data.healthFactor
      reserves = data.reserves
    } else if (!this.params.useSimulatorInsteadOfNode) {
      data = await this.getUserReserves(user)
      healthFactor = BigNumber.from(data.healthFactor)

      reserves = {}
      for (const reserve of data.reserves) {
        reserves[reserve.asset] = {
          collateralBalance: BigNumber.from(reserve.collateralBalance),
          borrowBalance: BigNumber.from(reserve.borrowBalance),
        }
      }
    } else {
      throw new Error("Mode should be 'node' or 'simulator'")
    }
    const hf = await this.calculateHealthFactor(healthFactor, user, provider)

    const rawAssets = reserves ? Object.keys(reserves) : []
    const assets = this.getAssets(rawAssets)

    /**
     * Check hf
     */
    if (hf < minHfDel) {
      this.emit("info", `user: ${user} [ del: true] |  HF: ${hf} , minHF: ${minHfDel}`, USER_SKIPPED_BY_LOW_HF)
      return { user, del: true, hf, reason: "low hf", assets }
    }
    if (hf > maxHfDel) {
      this.emit("info", `user: ${user} [ del: true] |  HF: ${hf}  maxHF /${maxHfDel}`, USER_SKIPPED_BY_HIGH_HF)
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
      this.emit("info", `user: ${user} [skipped] | No collateral`, USER_SKIPPED_BY_LOW_COLLATERAL)
      return { user, del: true, hf, borrow, reason: "No collateral", assets }
    }
    if (borrow.addresses.length === 0) {
      this.emit("info", `user: ${user} [skipped] | No borrow`, USER_SKIPPED_BY_LOW_BORROW)
      return { user, del: true, hf, collateral, reason: "No borrow", assets }
    }
    /**
     * Check is user valid to liquidate
     */
    if (hf < minHfLiq || hf > maxHfLiq) {
      /**
       * If not - back him to watch list
       */
      this.emit("info", `user: ${user} back to [watch] list | HF: ${hf} , minHF: ${minHfLiq} maxHF: ${maxHfLiq}`, USER_SKIPPED_BY_HF)
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
