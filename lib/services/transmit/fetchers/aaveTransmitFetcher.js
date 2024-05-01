"use strict"
const { TransmitFetcher } = require("./transmitFetcher")
const { BigNumber } = require("ethers")
const { getProvider } = require("../../../ethers/pool")

/**
 * Import events logger constants from config/const.js
 */
const { USER_SKIPPED_BY_FILTERS, USER_SKIPPED_BY_LOW_COLLATERAL, USER_SKIPPED_BY_LOW_BORROW } = require("../../../../configs/eventTopicsConstants")

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
	console.log(decimals)	
           this.emit("info", `User: ${user} | Collateral token ${name} [skipped] | decimals: ${decimals.toString()} | ethCollateral ${ethCollateral}, minCollateral ${minCollateral} | ethBorrow ${ethBorrow}, minBorrow ${minBorrow} | user : ${user}`, USER_SKIPPED_BY_FILTERS)
      }

      if (ethBorrow >= minBorrow) {
        borrow.addresses.push(name)
        borrow.amounts.push(borrowBalance.toString())
      } else {
 console.log(decimals)   
          this.emit("info", `User: ${user} Borrow token ${name} [skipped] | | decimals: ${decimals.toString()} | small ethBorrow ${ethBorrow}, minBorrow ${minBorrow} | ethCollateral ${ethCollateral}, minCollateral ${minCollateral} user: ${user}`, USER_SKIPPED_BY_FILTERS)
      }
    }

    if (collateral.addresses.length === 0) return this.emit("info", `user ${user} [skipped] | don't have have any suitable collateral`, USER_SKIPPED_BY_LOW_COLLATERAL)
    if (borrow.addresses.length === 0) return this.emit("info", `user ${user} [skipped] | don't have any suitable borrow`, USER_SKIPPED_BY_LOW_BORROW)
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
