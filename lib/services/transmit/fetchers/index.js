const { TransmitFetcher } = require("./transmitFetcher")
const { TransmitV1 } = require("./transmitV1")
const { TransmitV2 } = require("./transmitV2")
const { TransmitV3 } = require("./transmitV3")
const { TransmitCompound } = require("./transmitCompound")

/**
 * Factories
 * @returns {TransmitFetcher}
 */
const createV1TransmitFetcher = (params, config, simulator) => new TransmitV1(params, config, simulator)
const createV2TransmitFetcher = (params, config, simulator) => new TransmitV2(params, config, simulator)
const createV3TransmitFetcher = (params, config, simulator) => new TransmitV3(params, config, simulator)
const createCompoundTransmitFetcher = (params, config, simulator) => new TransmitCompound(params, config, simulator)

/**
 * Get trasmit fetcher by protocol
 * @param {string} protocol - protocol name (V1, V2, V3, Compound)
 * @param {*} params - object that contains { minHF, maxHF }
 * @param {*} config - config object with all settings variables
 * @param {*} simulator -Interface for enso simulator
 *
 * @returns {TransmitFetcher}
 */
const createTransmitFetcher = (protocol, params, config, simulator) => {
  if (protocol === "V1") return createV1TransmitFetcher(params, config, simulator)
  if (protocol === "V2") return createV2TransmitFetcher(params, config, simulator)
  if (protocol === "V3") return createV3TransmitFetcher(params, config, simulator)
  if (protocol === "Compound") return createCompoundTransmitFetcher(params, config, simulator)
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
