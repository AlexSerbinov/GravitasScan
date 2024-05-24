const { Fetcher } = require("./fetcher")
const { FetcherV1 } = require("./fetcher-aave-v1")
const { FetcherV2 } = require("./fetcher-aave-v2")
const { FetcherV3 } = require("./fetcher-aave-v3")
const { FetcherLiquity } = require("./fetcher-liquity")
const { FetcherCompound } = require("./fetcher-compound")
const { FetcherMakerDao } = require("./fetcher-marker-dao")

/**
 * Factories
 * @returns {Fetcher}
 */
const createV1Fetcher = (filters, config, params, simulator) => new FetcherV1(filters, config, params, simulator)
const createV2Fetcher = (filters, config, params, simulator) => new FetcherV2(filters, config, params, simulator)
const createV3Fetcher = (filters, config, params, simulator) => new FetcherV3(filters, config, params, simulator)
const createCompoundFetcher = (filters, config, params, simulator) => new FetcherCompound(filters, config, params, simulator)
const createLiquityFetcher = filters => new FetcherLiquity(filters)
const createMakerDaoFetcher = filters => new FetcherMakerDao(filters)

/**
 * Factory function to get the appropriate fetcher class
 * @param {*} params -  object that contains all params from $.params
 * @param {*} filters - object that contains { minHF, maxHF }
 * @param {*} config - all configs from Main.json
 * @param {*} simulator - Simulator instance
 * @returns {Fetcher} The fetcher instance
 */

const createFetcher = (protocol, filters, config, params, simulator) => {
  if (protocol === "V1") return createV1Fetcher(filters, config, params, simulator)
  if (protocol === "V2") return createV2Fetcher(filters, config, params, simulator)
  if (protocol === "V3") return createV3Fetcher(filters, config, params, simulator)
  if (protocol === "Compound") return createCompoundFetcher(filters, config, params, simulator)
  if (protocol === "Liquity") return createLiquityFetcher(filters)
  if (protocol === "MakerDAO_CDP") return createMakerDaoFetcher(filters)
  throw new Error("Invalid protocol.")
}

module.exports = {
  Fetcher,
  FetcherV1,
  FetcherV2,
  FetcherV3,
  FetcherCompound,
  FetcherLiquity,
  FetcherMakerDao,
  createV1Fetcher,
  createV2Fetcher,
  createV3Fetcher,
  createCompoundFetcher,
  createLiquityFetcher,
  createFetcher,
}
