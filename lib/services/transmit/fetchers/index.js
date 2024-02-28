const { TransmitFetcher } = require("./transmitFetcher")
const { TransmitV1 } = require("./transmitV1")
const { TransmitV2 } = require("./transmitV2")
const { TransmitV3 } = require("./transmitV3")
const { TransmitCompound } = require("./transmitCompound")

/**
 * Factories
 * @returns {TransmitFetcher}
 */
const createV1TransmitFetcher = (params, config) => new TransmitV1(params, config)
const createV2TransmitFetcher = (params, config) => new TransmitV2(params, config)
const createV3TransmitFetcher = (params, config) => new TransmitV3(params, config)
const createCompoundTransmitFetcher = (params, config) => new TransmitCompound(params, config)

/**
 * Get trasmit fetcher by protocol
 * @param {string} protocol - protocol name (V1, V2, V3, Compound)
 * @param {*} params - object that contains { minHF, maxHF }
 * @returns {TransmitFetcher}
 */
const createTransmitFetcher = (protocol, params, config) => {
    if (protocol === "V1") return createV1TransmitFetcher(params, config)
    if (protocol === "V2") return createV2TransmitFetcher(params, config)
    if (protocol === "V3") return createV3TransmitFetcher(params, config)
    if (protocol === "Compound") return createCompoundTransmitFetcher(params, config)
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
