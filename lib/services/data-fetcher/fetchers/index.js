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
const createV1Fetcher = (params, config) => new FetcherV1(params, config)
const createV2Fetcher = (params, config) => new FetcherV2(params, config)
const createV3Fetcher = (params, config) => new FetcherV3(params, config)
const createCompoundFetcher = (params, config) => new FetcherCompound(params, config)
const createLiquityFetcher = params => new FetcherLiquity(params)
const createMakerDaoFetcher = params => new FetcherMakerDao(params)
/**
 * Get fetcher by protocol
 * @param {string} protocol - protocol name (V1, V2, V3, Compound)
 * @param {*} params - object that contains { minHF, maxHF }
 * @param {*} config - config object with all settings variables
 *
 * @returns {Fetcher}
 */

const createFetcher = (protocol, params, config) => {
  if (protocol === "V1") return createV1Fetcher(params, config)
  if (protocol === "V2") return createV2Fetcher(params, config)
  if (protocol === "V3") return createV3Fetcher(params, config)
  if (protocol === "Compound") return createCompoundFetcher(params, config)
  if (protocol === "Liquity") return createLiquityFetcher(params)
  if (protocol === "MakerDAO_CDP") return createMakerDaoFetcher(params)
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
