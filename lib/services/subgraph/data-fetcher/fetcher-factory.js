"use strict"
const { Fetcher } = require("./fetcher")
const { FetcherV1 } = require("./fetcher-aave-v1")
const { FetcherV2 } = require("./fetcher-aave-v2")
const { FetcherV3 } = require("./fetcher-aave-v3")
const { FetcherCompound } = require("./fetcher-compound")
const { FetcherLiquity } = require("./fetcher-liquity")
const { FetcherMarketDAO } = require("./fetcher-marker-dao")

const createFetcherV1 = (params, settings, config) => new FetcherV1(params, settings, config)
const createFetcherV2 = (params, settings, config) => new FetcherV2(params, settings, config)
const createFetcherV3 = (params, settings, config) => new FetcherV3(params, settings, config)
const createFetcherCompound = (params, settings, config) => new FetcherCompound(params, settings, config)
const createFetcherLiquity = (params, settings) => new FetcherLiquity(params, settings)
const createFetcherMarketDAO = (params, settings) => new FetcherMarketDAO(params, settings)

/**
 * Factory function to get the appropriate fetcher class
 * @param {*} params -  object that contains all params from $.params
 * @param {*} settings - object that contains { minHF, maxHF }
 * @returns {Fetcher} The fetcher instance
 */
const getFetcher = (params, settings, config) => {
  switch (
    params.protocol // protocol ('V1', 'V2', 'V3' or 'Compound', 'Liquity', 'MarketDAO')
  ) {
    case "V1":
      return createFetcherV1(params, settings, config)
    case "V2":
      return createFetcherV2(params, settings, config)
    case "V3":
      return createFetcherV3(params, settings, config)
    case "Compound":
      return createFetcherCompound(params, settings, config)
    case "Liquity":
      return createFetcherLiquity(params, settings)
    case "MakerDAO_CDP":
      return createFetcherMarketDAO(params, settings)
    default:
      throw new Error(`Unsupported protocol: ${params.protocol}`)
  }
}

module.exports = { getFetcher }
