"use strict"
const { Fetcher } = require("./fetcher")
const { FetcherV1 } = require("./fetcher-aave-v1")
const { FetcherV2 } = require("./fetcher-aave-v2")
const { FetcherV3 } = require("./fetcher-aave-v3")
const { FetcherCompound } = require("./fetcher-compound")
const { FetcherLiquity } = require("./fetcher-liquity")
const { FetcherMarketDAO } = require("./fetcher-marker-dao")

const createFetcherV1 = (protocol, filters, config) => new FetcherV1(protocol, filters, config)
const createFetcherV2 = (protocol, filters, config) => new FetcherV2(protocol, filters, config)
const createFetcherV3 = (protocol, filters, config) => new FetcherV3(protocol, filters, config)
const createFetcherCompound = (protocol, filters, config) => new FetcherCompound(protocol, filters, config)
const createFetcherLiquity = (protocol, filters, config) => new FetcherLiquity(protocol, filters, config)
const createFetcherMarketDAO = (protocol, filters, config) => new FetcherMarketDAO(protocol, filters, config)

/**
 * Factory function to get the appropriate fetcher class
 * @param {string} protocol - Protocol ('V1', 'V2', 'V3' or 'Compound', 'Liquity', 'MarketDAO')
 * @param {*} filters - object that contains { minHF, maxHF }
 * @param {*} config - Main.json
 * @returns {Fetcher} The fetcher instance
 */
const getFetcher = (protocol, filters, config) => {
  switch (protocol) {
    case "V1":
      return createFetcherV1(protocol, filters, config)
    case "V2":
      return createFetcherV2(protocol, filters, config)
    case "V3":
      return createFetcherV3(protocol, filters, config)
    case "Compound":
      return createFetcherCompound(protocol, filters, config)
    case "Liquity":
      return createFetcherLiquity(protocol, filters, config)
    case "MakerDAO_CDP":
      return createFetcherMarketDAO(protocol, filters, config)
    default:
      throw new Error(`Unsupported protocol: ${protocol}`)
  }
}

module.exports = { getFetcher }
