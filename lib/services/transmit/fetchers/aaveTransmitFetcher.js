"use strict"
const { TransmitFetcher } = require("./transmitFetcher")
const { BigNumber } = require("ethers")
const { getProvider } = require("../../../ethers/pool")

/**
 * Abstract fetcher for AAVE contract users
 */
class TransmitFetcherAave extends TransmitFetcher {
  /**
   * @param {*} settings - object that contains
   * services settings
   * @param {*} config - config object with all settings variables
   * @param {*} simulator - Interface for enso simulator
   *
   */
  constructor(settings, config, simulator) {
    super(settings, config, simulator)
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
   * @param {number} hf - user helth factor
   *
   */
  async execute(user, hf) {
    /**
     * Prepare params
     */
    const { globalReservesData, settings } = this
    const { minBorrow, minCollateral } = settings

    /**
     * Get data
     */
    const provider = getProvider()
    const contract = this.getContract(provider)
    const { reserves } = await contract.getUserReserves(user)

    /**
     * Analize data
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
      } else {
        //   this.emit("info", `Collateral token ${name} [skipped] | ethCollateral ${ethCollateral}, minCollateral ${minCollateral} | ethBorrow ${ethBorrow}, minBorrow ${minBorrow} | user : ${user}`, "user_skipped_by_filters")
      }

      if (ethBorrow >= minBorrow) {
        borrow.addresses.push(name)
        borrow.amounts.push(borrowBalance.toString())
      } else {
        //  this.emit("info", `Borrow token ${name} [skipped] | small ethBorrow ${ethBorrow}, minBorrow ${minBorrow} | ethCollateral ${ethCollateral}, minCollateral ${minCollateral} user: ${user}`, "user_skipped_by_filters")
      }
    }

    if (collateral.addresses.length === 0) return this.emit("info", `user ${user} [skipped] | don't have have any suitable collateral`, "user_skipped_by_collateral")
    if (borrow.addresses.length === 0) return this.emit("info", `user ${user} [skipped] | don't have any suitable borrow`, "user_skipped_by_borrow")
    /**
     * return user data to liquidate
     */
    return {
      user: user.toLowerCase(),
      health_factor: hf,
      reserve_addresses: borrow.addresses,
      reserve_amounts: borrow.amounts,
      collateral_addresses: collateral.addresses,
      collateral_amounts: collateral.amounts,
      liq: true,
    }
  }

  getContract() {
    throw new Error("Method not implemented.")
  }
}

module.exports = { TransmitFetcherAave }
