"use strict"
const { FetcherAave } = require("./aave-fetcher")
const { getHelper } = require("../../../helpers/onchain-aggr-V1")
const { Contract } = require("ethers")
const { PROTOCOLS_CONFIG } = require("../../../constants")
const CONTROLLER_ABI = require("../../../artifacts/compound/ControllerABI")

/**
 * FetcherCompound user data fetcher
 */
class FetcherCompound extends FetcherAave {
  /**
   * @param {*} filters - object that contains { minHF, maxHF, minBorrow ...}
   * @param {*} config - Main.json
   * @param {*} params - params object from [protocol]filters.json param field
   */
  constructor(filters, config, params, simulator) {
    super(filters, config, params, simulator)
    this.config = config
    this.params = params
  }

  /**
   * Gett aave helper contract
   * @param {Provider} - rpc provider
   * @returns {Helper}
   */
  getContract(provider) {
    const helper = getHelper("Compound", provider, this.config)
    helper.setGlobalReserves(this.globalReservesData)
    return helper
  }

  /**
   * Due to fact that compound uses cTokens (cDAI, cUSDT, etc) almost in the whole system,
   * we choosed to convert it directly from globalDataReserve event from service events.js to save Compounds origin token addresses.
   * @param {*} rawAssets
   * @returns
   */
  getAssets(rawAssets) {
    return rawAssets.map(asset => this.globalReservesData[asset].underlying)
  }

  /**
   * Calculates the health factor of a user's position in the Compound protocol.
   *
   * @param {number} healthFactor - The current health factor of the user's position.
   * @param {string} user - The address of the user for whom to calculate the health factor.
   * @param {object} provider - The Web3 provider used to interact with the blockchain.
   *
   * @return {number} - The calculated health factor.
   *
   *
   * This method interacts with the Compound protocol's Controller contract to determine
   * the liquidity status of a user's account. It calls the `getAccountLiquidity` function
   * of the Comptroller, which returns a tuple of three values: (error, liquidity, shortfall).
   *
   * The `liquidity` value (`liquidateData[1]`) represents the account's available liquidity in
   * the Compound protocol. It indicates the USD value that the user can still borrow before
   * their position becomes subject to liquidation.
   *
   * If `liquidity` is equal to 0, it means that the user's account has no available liquidity
   * and CAN BE LIQUIDATED. In this case, the method returns a fixed value of 0.99.
   *
   * On the other hand, if `liquidity` is greater than 0, the method returns the provided
   * `healthFactor` divided by 10^18. As I undrestand, in this case HF will be > 1, so we return real HF
   */
  async calculateHealthFactor(healthFactor, user, provider) {
    const controllerAddress = PROTOCOLS_CONFIG.Compound.CONTROLLER
    const constrollerInstance = new Contract(controllerAddress, CONTROLLER_ABI, provider)
    // const liquidateData = await constrollerInstance.getAccountLiquidity(user)

    // return Number(liquidateData[1]) == 0 ? 0.99 : healthFactor / 10 ** 18
    return healthFactor / 10 ** 18
  }
}

module.exports = { FetcherCompound }
