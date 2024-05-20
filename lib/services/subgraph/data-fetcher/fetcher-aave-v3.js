const { Fetcher } = require("./fetcher")
const { Contract } = require("ethers")
const { BigNumber } = require("bignumber.js")
// Import constants topic to logger from config/const.js
const { SIMULATION_RESULT, SIMULATION_ERROR } = require("../../../../configs/eventTopicsConstants")

/* Helper contract */
const { getHelper } = require("../../../helpers/onchain-aggr-V1")

/* Pool contract */
const V3LendingPoolABI = require("../../../artifacts/v3/PoolABI")
const { PROTOCOLS_CONFIG } = require("../../../constants")
const V3AaveOracleABI = require("../../../artifacts/v3/AaveOracleABI")

class FetcherV3 extends Fetcher {
  constructor(params, settings, config, simulator) {
    super(params, settings, config, simulator)
    this.config = config
    this.simulator = simulator

    this.params = params
    this.helperContract = getHelper(this.params.protocol, this.provider, this.config)
    this.contract = new Contract(PROTOCOLS_CONFIG.V3.POOL, V3LendingPoolABI, this.provider)
    this.oracleContract = new Contract("0x54586bE62E3c3580375aE3723C145253060Ca0C2", V3AaveOracleABI, this.provider)
  }

  /**
   * Retrieves users' data by simulating transactions for the given addresses.
   * @param {Array} addresses - The addresses to get data for.
   * @param {number} blockTag - The block number to execute the transaction.
   * @returns {Array} The users' data.
   */

  async getUsersData(addresses, blockTag) {
    const resp = await this.prepareAndSimulateTransaction(addresses)
    if (resp[0].user && resp[0].user != 0x0) {
      this.emit("info", `Simulation SUCCESS`, SIMULATION_RESULT)
    } else {
      const message = `Simulation FAILLED: usersData failed to receive from simulator`
      this.emit("info", message, SIMULATION_ERROR)
    }

    const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    const WETHPriceDecimal = 8
    const WETHPrice = await this.oracleContract.getAssetPrice(WETHAddress, {
      blockTag,
    })
    const WETHPriceB = new BigNumber(WETHPrice.toString())

    const responses = []

    resp.forEach(resp => {
      const totalCollateralBaseB = new BigNumber(resp.totalCollateralETH.toString())
      const totalDebtBaseB = new BigNumber(resp.totalBorrowsETH.toString())
      const base = new BigNumber(10 ** 18)

      const totalCollateralETH = totalCollateralBaseB.div(WETHPriceB).times(base).toFixed(0)
      const totalBorrowsETH = totalDebtBaseB.div(WETHPriceB).times(base).toFixed(0)
      responses.push({
        user: resp.user,
        healthFactor: resp.healthFactor,
        totalCollateralETH,
        totalBorrowsETH,
      })
    })
    return responses
  }
}

module.exports = { FetcherV3 }
