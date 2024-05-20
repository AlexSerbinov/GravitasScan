const { Fetcher } = require("./fetcher")
const { FetcherV1 } = require("./v1-fetcher")
const { FetcherV2 } = require("./v2-fetcher")
const { FetcherV3 } = require("./v3-fetcher")
const { FetcherLiquity } = require("./liquity-fetcher")
const { FetcherCompound } = require("./compound-fetcher")
const { FetcherMakerDao } = require("./marker-dao-fetcher")

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
 * Get fetcher by protocol
 * @param {string} protocol - protocol name (V1, V2, V3, Compound)
 * @param {*} filters - object that contains { minHF, maxHF }
 * @param {*} config - Main.json
 * @param {*} params - object from [protocol]Settings.json param field
 *
 * @returns {Fetcher}
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
