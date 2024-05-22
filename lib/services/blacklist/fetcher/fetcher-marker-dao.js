const { Fetcher } = require("./fetcher")
const { Contract, BigNumber } = require("ethers")
const { PROTOCOLS_CONFIG } = require("../../../constants")
const CdpManagerABI = require("../../../artifacts/makerdao/CdpManager")
const IlkRegistryABI = require("../../../artifacts/makerdao/IlkRegistry")
const VatABI = require("../../../artifacts/makerdao/Vat")
const SpotterABI = require("../../../artifacts/makerdao/Spotter")

/**
 * @param {string} protocol - The protocol of the protocol ('V1', 'V2', 'V3' or 'Compound')
 * @param {*} filters - object that contains { minHF, maxHF, minBorrow ...}
 * @param {*} config -Main.json
 */
class FetcherMarketDAO extends Fetcher {
  constructor(params, filters, config, simulator) {
    super(params, filters, config, simulator)

    const { CDP_MANAGER, VAT, SPOTTER, ILK_REGISTRY } = PROTOCOLS_CONFIG.MakerDAO

    this.cdpManager = new Contract(CDP_MANAGER, CdpManagerABI, this.provider)
    this.vat = new Contract(VAT, VatABI, this.provider)
    this.spotter = new Contract(SPOTTER, SpotterABI, this.provider)
    this.ilkRegistry = new Contract(ILK_REGISTRY, IlkRegistryABI, this.provider)
  }

  async loadUserReserves({ address, blockTag = "latest" }) {
    const { min_health_factor, min_borrow_amount, min_collateral_amount } = this.filters

    const minCollateralAmount = min_collateral_amount * 10 ** 18
    const minBorrowAmount = min_borrow_amount * 10 ** 18

    try {
      const firstCdpId = await this.cdpManager.first(address).then((v) => v.toNumber())
      const userCdpIds = []

      if (firstCdpId) {
        userCdpIds.push(firstCdpId)

        let lastCdpId = firstCdpId
        while (lastCdpId) {
          const next = await this.cdpManager.list(lastCdpId).then((res) => res.next.toNumber())

          if (next) {
            userCdpIds.push(next)
          }

          lastCdpId = next
        }
      }

      const usersCdpIdsRes = await Promise.all(
        userCdpIds.map(async (cdpId) => {
          const [ilk, urn] = await Promise.all([this.cdpManager.ilks(cdpId), this.cdpManager.urns(cdpId)])
          const [collateral, { pip: oracle, mat }] = await Promise.all([
            this.ilkRegistry.gem(ilk),
            this.spotter.ilks(ilk),
          ])
          const [{ ink: collateralAmount, art: initialDebtAmount }, { rate: stabilityFeeRate, spot: minUnitPrice }] =
            await Promise.all([this.vat.urns(ilk, urn), this.vat.ilks(ilk)])

          const liquidationRatio = mat.div(BigNumber.from(10).pow(9))
          const debtAmount = initialDebtAmount.mul(stabilityFeeRate).div(BigNumber.from(10).pow(27))
          const collateralizationRatio = debtAmount.eq(0)
            ? BigNumber.from(0)
            : collateralAmount.mul(minUnitPrice).mul(liquidationRatio).div(debtAmount).div(BigNumber.from(10).pow(27))

          const healthFactor = collateralizationRatio / liquidationRatio

          if (healthFactor > min_health_factor) {
            return cdpId
          }

          /**
           * may be need to add collateral and debt filtration
           */
        })
      )

      const filteredUserCdps = usersCdpIdsRes.filter((cdp) => cdp !== undefined)

      if (filteredUserCdps.length) {
        return { user: address, add: false }
      }

      return { user: address, add: true }
    } catch (e) {
      return { error: `loadUserReserves - ${e}` }
    }
  }

  /**
   * some actions after created Fetcher instance
   */
  async init() {
    this.emit("fetcherReady", {})
  }
}

module.exports = {
  FetcherMarketDAO,
}
