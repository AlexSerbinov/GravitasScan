"use strict"
const { TransmitFetcher } = require("./transmitFetcher")
const { BigNumber } = require("ethers")
const { getProvider } = require("../../../ethers/pool")

/**
 * Import events logger constants from config/const.js
 */
const { USER_SKIPPED_BY_LOW_COLLATERAL, USER_SKIPPED_BY_LOW_BORROW, BORROW_SKIPPED, COLLATERAL_SKIPPED, BORROW_AND_COLLATERAL_ACCEPTED } = require("../../../../configs/eventTopicsConstants")

/**
 * Abstract fetcher for AAVE contract users
 */
class TransmitFetcherAave extends TransmitFetcher {
  /**
   * @param {*} filters - object that contains
   * services filters
   * @param {number} maxNumberOfUsersToSimulate - The maximum number of users for parallel simulation.
   * @param {*} config - config object with all filters variables
   * @param {*} simulator - Interface for enso simulator
   *
   */
  constructor(filters, maxNumberOfUsersToSimulate, config, simulator) {
    super(filters, maxNumberOfUsersToSimulate, config, simulator)
  }

  /**
   * After simulation results and filtering users by their Health Factor (HF),
   * the user progresses to the next stage (this stage) - finding suitable borrow options and collateral.
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
  async filterUserByLiqFilters(user, hf) {
    /**
     * Prepare params
     */
    const { globalReservesData, filters } = this
    const { minBorrow, minCollateral } = filters

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
    for (const tokenAddress in reserves) {
      const reserve = reserves[tokenAddress]
      const { collateralBalance, borrowBalance } = reserve
      const { price, decimals } = globalReservesData[tokenAddress]
      const ethPrice = BigNumber.from(price) / 10 ** 18
      const ethCollateral = (collateralBalance / 10 ** BigNumber.from(decimals)) * ethPrice
      const ethBorrow = (borrowBalance / 10 ** BigNumber.from(decimals)) * ethPrice

      if (ethCollateral >= minCollateral) {
        collateral.addresses.push(tokenAddress)
        collateral.amounts.push(collateralBalance.toString())
      } else {
        this.emit("info", `For user: ${user} | Collateral token: ${tokenAddress} [skipped] | decimals: ${+decimals.hex} | EthCollateral ${ethCollateral}, minCollateral ${minCollateral}`, COLLATERAL_SKIPPED)
      }

      if (ethBorrow >= minBorrow) {
        borrow.addresses.push(tokenAddress)
        borrow.amounts.push(borrowBalance.toString())
      } else {
        this.emit("info", `For user: ${user} | Borrow token: ${tokenAddress} [skipped] | decimals: ${+decimals.hex} | small ethBorrow ${ethBorrow}, minBorrow ${minBorrow}`, BORROW_SKIPPED)
      }
    }

    if (collateral.addresses.length === 0) return this.emit("info", `user ${user} [skipped] | don't have have any suitable collateral`, USER_SKIPPED_BY_LOW_COLLATERAL)
    if (borrow.addresses.length === 0) return this.emit("info", `user ${user} [skipped] | don't have any suitable borrow`, USER_SKIPPED_BY_LOW_BORROW)
    /**
     * return user data to liquidate
     */
    this.emit(
      "info",
      `${JSON.stringify({
        user: user.toLowerCase(),
        reserve_addresses: borrow.addresses,
        reserve_amounts: borrow.amounts,
        collateral_addresses: collateral.addresses,
        collateral_amounts: collateral.amounts,
      })}`,
      BORROW_AND_COLLATERAL_ACCEPTED
    )

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
