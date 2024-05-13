const { Fetcher } = require("./fetcher")
const { Contract } = require("ethers")

/* Helper contract */
const { getHelper } = require("../../../helpers/onchain-aggr-V1")

/* Pool contract */
const V2LendingPoolABI = require("../../../artifacts/v2/LendingPoolABI")
const { PROTOCOLS_CONFIG } = require("../../../constants")

/**
 * @param {string} protocol - The protocol of the protocol ('V1', 'V2', 'V3' or 'Compound')
 * @param {*} filters - object that contains { minHF, maxHF, minBorrow ...}
 * @param {*} config -Main.json
 */
class FetcherV2 extends Fetcher {
  constructor(protocol, filters, config) {
    super(protocol, filters, config)

    this.helperContract = getHelper(this.protocol, this.provider, config)
    this.contract = new Contract(PROTOCOLS_CONFIG.V2.POOL, V2LendingPoolABI, this.provider)
  }

  async getUserData(address, blockTag) {
    const userData = await this.contract.getUserAccountData(address, {
      blockTag,
    })

    return {
      healthFactor: userData.healthFactor,
      totalCollateralETH: userData.totalCollateralETH,
      totalBorrowsETH: userData.totalDebtETH,
    }
  }
}

module.exports = { FetcherV2 }
