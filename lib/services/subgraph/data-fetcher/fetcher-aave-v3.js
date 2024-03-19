const { Fetcher } = require("./fetcher")
const { Contract } = require("ethers")
const { BigNumber } = require("bignumber.js")

/* Helper contract */
const { getHelper } = require("../../../helpers/onchain-aggr-V1")

/* Pool contract */
const V3LendingPoolABI = require("../../../artifacts/v3/PoolABI")
const { PROTOCOLS_CONFIG } = require("../../../constants")
const V3AaveOracleABI = require("../../../artifacts/v3/AaveOracleABI")

class FetcherV3 extends Fetcher {
  constructor(params, settings, config) {
    super(params, settings, config)
    this.config = config

    this.params = params
    this.helperContract = getHelper(this.params.protocol, this.provider, this.config)
    this.contract = new Contract(PROTOCOLS_CONFIG.V3.POOL, V3LendingPoolABI, this.provider)
    this.oracleContract = new Contract("0x54586bE62E3c3580375aE3723C145253060Ca0C2", V3AaveOracleABI, this.provider)
  }

  async getUsersData(address, blockTag) {
    const { healthFactor, totalCollateralBase, totalDebtBase } = await this.contract.getUserAccountData(address, {
      blockTag,
    })

    const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    const WETHPriceDecimal = 8
    const WETHPrice = await this.oracleContract.getAssetPrice(WETHAddress, {
      blockTag,
    })

    const WETHPriceB = new BigNumber(WETHPrice.toString())
    const totalCollateralBaseB = new BigNumber(totalCollateralBase.toString())
    const totalDebtBaseB = new BigNumber(totalDebtBase.toString())
    const base = new BigNumber(10 ** 18)

    const totalCollateralETH = totalCollateralBaseB.div(WETHPriceB).times(base).toFixed(0)
    const totalBorrowsETH = totalDebtBaseB.div(WETHPriceB).times(base).toFixed(0)

    return {
      healthFactor,
      totalCollateralETH,
      totalBorrowsETH,
    }
  }
}

module.exports = { FetcherV3 }
