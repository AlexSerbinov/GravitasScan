"use strict"
const { Fetcher } = require("./fetcher")
const { PROTOCOLS_CONFIG } = require("../../../constants")
const { Contract, BigNumber } = require("ethers")
const { getProvider } = require("../../../ethers/pool")

const CdpManagerABI = require("../../../artifacts/makerdao/CdpManager")
const IlkRegistryABI = require("../../../artifacts/makerdao/IlkRegistry")
const VatABI = require("../../../artifacts/makerdao/Vat")
const SpotterABI = require("../../../artifacts/makerdao/Spotter")

class FetcherMakerDao extends Fetcher {
  /**
   * @param {*} settings - object that contains
   * services settings
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
  async filterUserByLiqFilters(user) {
    /**
     * Prepare params
     */

    const { settings } = this
    const { minHfDel, minHfLiq, maxHfDel, maxHfLiq } = settings

    const { CDP_MANAGER, VAT, SPOTTER, ILK_REGISTRY } = PROTOCOLS_CONFIG.MakerDAO

    const provider = getProvider()

    this.cdpManager = new Contract(CDP_MANAGER, CdpManagerABI, provider)
    this.vat = new Contract(VAT, VatABI, provider)
    this.spotter = new Contract(SPOTTER, SpotterABI, provider)
    this.ilkRegistry = new Contract(ILK_REGISTRY, IlkRegistryABI, provider)
    /**
     * Get data
     */
    const firstCdpId = await this.cdpManager.first(user).then(v => v.toNumber())
    const userCdpIds = []

    if (firstCdpId) {
      userCdpIds.push(firstCdpId)

      let lastCdpId = firstCdpId
      while (lastCdpId) {
        const next = await this.cdpManager.list(lastCdpId).then(res => res.next.toNumber())

        if (next) {
          userCdpIds.push(next)
        }

        lastCdpId = next
      }
    }

    const usersCdpIdsRes = await Promise.all(
      userCdpIds.map(async cdpId => {
        const [ilk, urn] = await Promise.all([this.cdpManager.ilks(cdpId), this.cdpManager.urns(cdpId)])
        const [collateral, { pip: oracle, mat }] = await Promise.all([this.ilkRegistry.gem(ilk), this.spotter.ilks(ilk)])
        const [{ ink: collateralAmount, art: initialDebtAmount }, { rate: stabilityFeeRate, spot: minUnitPrice }] = await Promise.all([this.vat.urns(ilk, urn), this.vat.ilks(ilk)])

        const liquidationRatio = mat.div(BigNumber.from(10).pow(9))
        const debtAmount = initialDebtAmount.mul(stabilityFeeRate).div(BigNumber.from(10).pow(27))
        const collateralizationRatio = debtAmount.eq(0) ? BigNumber.from(0) : collateralAmount.mul(minUnitPrice).mul(liquidationRatio).div(debtAmount).div(BigNumber.from(10).pow(27))

        const healthFactor = collateralizationRatio / liquidationRatio

        if (healthFactor >= minHfDel && healthFactor <= maxHfDel) {
          return { cdpId: cdpId ?? undefined, debtAmount, collateralAmount, healthFactor }
        }
      })
    )
    if (usersCdpIdsRes == undefined) return

    const filteredUserCdps = usersCdpIdsRes.filter(cdp => {
      if (!cdp) return false
      if (!cdp.cdpId) return false
      return true
    })
    const zero = BigNumber.from(0)

    for (let index = 0; index < filteredUserCdps.length; index++) {
      /**
       * Delete if no balance
       */
      if (!filteredUserCdps[index].debtAmount.gt(zero)) return { user, del: true, coll, reason: "No borrow" }
      if (!filteredUserCdps[index].collateralAmount.gt(zero)) return { user, del: true, debt, reason: "No collateral" }

      /**
       * Check hf
       */
      if (filteredUserCdps[index].healthFactor < minHfDel) return { user, del: true, reason: "low hf" }
      if (filteredUserCdps[index].healthFactor > maxHfDel) return { user, del: true, reason: "High hf" }

      /**
       * Check is user valid to liquidate
       */
      if (filteredUserCdps[index].healthFactor < minHfLiq || filteredUserCdps[index].healthFactor > maxHfLiq) {
        /**
         * If not - back him to watchlist
         */
        return { user, watch: true }
      } else {
        return {
          user,
          health_factor: filteredUserCdps[index].healthFactor,
          cdpId: filteredUserCdps[index].cdpId,
          collateral_amount: filteredUserCdps[index].collateralAmount.toString(),
          borrow_amount: filteredUserCdps[index].debtAmount.toString(),
          liq: true,
        }
      }
    }
  }
}

module.exports = { FetcherMakerDao }
