"use strict"
const { Fetcher } = require("./fetcher")
const { FetcherV1 } = require("./fetcher-aave-v1")
const { FetcherV2 } = require("./fetcher-aave-v2")
const { FetcherV3 } = require("./fetcher-aave-v3")
const { FetcherCompound } = require("./fetcher-compound")
const { FetcherLiquity } = require("./fetcher-liquity")
const { FetcherMarketDAO } = require("./fetcher-marker-dao")

const createFetcherV1 = (protocol, params, config) => new FetcherV1(protocol, params, config)
const createFetcherV2 = (protocol, params, config) => new FetcherV2(protocol, params, config)
const createFetcherV3 = (protocol, params, config) => new FetcherV3(protocol, params, config)
const createFetcherCompound = (protocol, params, config) => new FetcherCompound(protocol, params, config)
const createFetcherLiquity = (protocol, params) => new FetcherLiquity(protocol, params)
const createFetcherMarketDAO = (protocol, params) => new FetcherMarketDAO(protocol, params)

/**
 * Factory function to get the appropriate fetcher class
 * @param {string} protocol - Protocol ('V1', 'V2', 'V3' or 'Compound', 'Liquity', 'MarketDAO')
 * @param {*} settings - object that contains { minHF, maxHF }
 * @returns {Fetcher} The fetcher instance
 */
const getFetcher = (protocol, settings, config) => {
  switch (protocol) {
    case "V1":
      return createFetcherV1(protocol, settings, config)
    case "V2":
      return createFetcherV2(protocol, settings, config)
    case "V3":
      return createFetcherV3(protocol, settings, config)
    case "Compound":
      return createFetcherCompound(protocol, settings, config)
    case "Liquity":
      return createFetcherLiquity(protocol, settings)
    case "MakerDAO_CDP":
      return createFetcherMarketDAO(protocol, settings)
    default:
      throw new Error(`Unsupported protocol: ${protocol}`)
  }
}

module.exports = { getFetcher }
