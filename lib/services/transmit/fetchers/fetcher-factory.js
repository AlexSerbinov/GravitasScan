const { TransmitFetcher } = require("./fetcher")
const { TransmitV1 } = require("./fetcher-aave-v1")
const { TransmitV2 } = require("./fetcher-aave-v2")
const { TransmitV3 } = require("./fetcher-aave-v3")
const { TransmitCompound } = require("./fetcher-compound")

/**
 * Factories
 * @returns {TransmitFetcher}
 */
const createV1TransmitFetcher = (filters, maxNumberOfUsersToSimulate, config, simulator) => new TransmitV1(filters, maxNumberOfUsersToSimulate, config, simulator)
const createV2TransmitFetcher = (filters, maxNumberOfUsersToSimulate, config, simulator) => new TransmitV2(filters, maxNumberOfUsersToSimulate, config, simulator)
const createV3TransmitFetcher = (filters, maxNumberOfUsersToSimulate, config, simulator) => new TransmitV3(filters, maxNumberOfUsersToSimulate, config, simulator)
const createCompoundTransmitFetcher = (filters, maxNumberOfUsersToSimulate, config, simulator) => new TransmitCompound(filters, maxNumberOfUsersToSimulate, config, simulator)

/**
 * Get trasmit fetcher by protocol
 * @param {string} protocol - protocol name (V1, V2, V3, Compound)
 * @param {*} filters - object that contains { minHF, maxHF, minBoorow, minCollaterral... }
 * @param {*} config - config object with all settings variables
 * @param {*} simulator -Interface for enso simulator
 *
 * @returns {TransmitFetcher}
 */
const createTransmitFetcher = (protocol, filters, maxNumberOfUsersToSimulate, config, simulator) => {
  if (protocol === "V1") return createV1TransmitFetcher(filters, maxNumberOfUsersToSimulate, config, simulator)
  if (protocol === "V2") return createV2TransmitFetcher(filters, maxNumberOfUsersToSimulate, config, simulator)
  if (protocol === "V3") return createV3TransmitFetcher(filters, maxNumberOfUsersToSimulate, config, simulator)
  if (protocol === "Compound") return createCompoundTransmitFetcher(filters, maxNumberOfUsersToSimulate, config, simulator)
  throw new Error("Invalid protocol.")
}

module.exports = {
  TransmitFetcher,
  TransmitV1,
  TransmitV2,
  TransmitV3,
  TransmitCompound,
  createV1TransmitFetcher,
  createV2TransmitFetcher,
  createV3TransmitFetcher,
  createCompoundTransmitFetcher,
  createTransmitFetcher,
}
