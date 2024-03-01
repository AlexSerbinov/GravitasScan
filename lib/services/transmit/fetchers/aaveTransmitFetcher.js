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
   */
  constructor(settings, config) {
    super(settings, config)
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
      }

      if (ethBorrow >= minBorrow) {
        borrow.addresses.push(name)
        borrow.amounts.push(borrowBalance.toString())
      }
    }

    if (collateral.addresses.length === 0) return this.emit("info", { info: `user ${user} don't have enough collateral` })
    if (borrow.addresses.length === 0) return this.emit("info", { info: `user ${user} don't have enough collateral` })
    /**
     * return user data to liquidate
     */
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

  getContract() {
    throw new Error("Method not implemented.")
  }
}

module.exports = { TransmitFetcherAave }
