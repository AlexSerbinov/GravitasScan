const { TransmitFetcher } = require("./transmitFetcher")
const { TransmitV1 } = require("./transmitV1")
const { TransmitV2 } = require("./transmitV2")
const { TransmitV3 } = require("./transmitV3")
const { TransmitCompound } = require("./transmitCompound")

/**
 * Factories
 * @returns {TransmitFetcher}
 */
const createV1TransmitFetcher = (filters, maxNumberOfUsersToSimulation, config, simulator) => new TransmitV1(filters, maxNumberOfUsersToSimulation, config, simulator)
const createV2TransmitFetcher = (filters, maxNumberOfUsersToSimulation, config, simulator) => new TransmitV2(filters, maxNumberOfUsersToSimulation, config, simulator)
const createV3TransmitFetcher = (filters, maxNumberOfUsersToSimulation, config, simulator) => new TransmitV3(filters, maxNumberOfUsersToSimulation, config, simulator)
const createCompoundTransmitFetcher = (filters, maxNumberOfUsersToSimulation, config, simulator) => new TransmitCompound(filters, maxNumberOfUsersToSimulation, config, simulator)

/**
 * Get trasmit fetcher by protocol
 * @param {string} protocol - protocol name (V1, V2, V3, Compound)
 * @param {*} filters - object that contains { minHF, maxHF, minBoorow, minCollaterral... }
 * @param {*} config - config object with all settings variables
 * @param {*} simulator -Interface for enso simulator
 *
 * @returns {TransmitFetcher}
 */
const createTransmitFetcher = (protocol, filters, maxNumberOfUsersToSimulation, config, simulator) => {
  if (protocol === "V1") return createV1TransmitFetcher(filters, maxNumberOfUsersToSimulation, config, simulator)
  if (protocol === "V2") return createV2TransmitFetcher(filters, maxNumberOfUsersToSimulation, config, simulator)
  if (protocol === "V3") return createV3TransmitFetcher(filters, maxNumberOfUsersToSimulation, config, simulator)
  if (protocol === "Compound") return createCompoundTransmitFetcher(filters, maxNumberOfUsersToSimulation, config, simulator)
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
