"use strict"
const { Fetcher } = require("./fetcher")
const { FetcherV1 } = require("./fetcher-aave-v1")
const { FetcherV2 } = require("./fetcher-aave-v2")
const { FetcherV3 } = require("./fetcher-aave-v3")
const { FetcherCompound } = require("./fetcher-compound")
const { FetcherLiquity } = require("./fetcher-liquity")
const { FetcherMarketDAO } = require("./fetcher-marker-dao")

const createFetcherV1 = (params, settings, config, simulator) => new FetcherV1(params, settings, config, simulator)
const createFetcherV2 = (params, settings, config, simulator) => new FetcherV2(params, settings, config, simulator)
const createFetcherV3 = (params, settings, config, simulator) => new FetcherV3(params, settings, config, simulator)
const createFetcherCompound = (params, settings, config, simulator) => new FetcherCompound(params, settings, config, simulator)
const createFetcherLiquity = (params, settings, simulator) => new FetcherLiquity(params, settings, simulator)
const createFetcherMarketDAO = (params, settings, simulator) => new FetcherMarketDAO(params, settings, simulator)

/**
 * Factory function to get the appropriate fetcher class
 * @param {*} params -  object that contains all params from $.params
 * @param {*} settings - object that contains { minHF, maxHF }
 * @param {*} config - all configs from Main.json
 * @param {*} simulator - Simulator instance
 * @returns {Fetcher} The fetcher instance
 */
const getFetcher = (params, settings, config, simulator) => {
  switch (
    params.protocol // protocol ('V1', 'V2', 'V3' or 'Compound', 'Liquity', 'MarketDAO')
  ) {
    case "V1":
      return createFetcherV1(params, settings, config, simulator)
    case "V2":
      return createFetcherV2(params, settings, config, simulator)
    case "V3":
      return createFetcherV3(params, settings, config, simulator)
    case "Compound":
      return createFetcherCompound(params, settings, config, simulator)
    case "Liquity":
      return createFetcherLiquity(params, settings, simulator)
    case "MakerDAO_CDP":
      return createFetcherMarketDAO(params, settings, simulator)
    default:
      throw new Error(`Unsupported protocol: ${params.protocol}`)
  }
}

module.exports = { getFetcher }
