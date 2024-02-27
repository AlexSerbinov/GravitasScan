const { TransmitFetcher } = require('./transmitFetcher')
const { TransmitV1 } = require('./transmitV1')
const { TransmitV2 } = require('./transmitV2')
const { TransmitV3 } = require('./transmitV3')
const { TransmitCompound } = require('./transmitCompound')

/**
 * Factories
 * @returns {TransmitFetcher}
 */
const createV1TransmitFetcher = params => new TransmitV1(params)
const createV2TransmitFetcher = params => new TransmitV2(params)
const createV3TransmitFetcher = params => new TransmitV3(params)
const createCompoundTransmitFetcher = params => new TransmitCompound(params)

/**
 * Get trasmit fetcher by protocol
 * @param {string} protocol - protocol name (V1, V2, V3, Compound)
 * @param {*} params - object that contains { minHF, maxHF }
 * @returns {TransmitFetcher}
 */
const createTransmitFetcher = (protocol, params) => {
    if (protocol === 'V1') return createV1TransmitFetcher(params)
    if (protocol === 'V2') return createV2TransmitFetcher(params)
    if (protocol === 'V3') return createV3TransmitFetcher(params)
    if (protocol === 'Compound') return createCompoundTransmitFetcher(params)
    throw new Error('Invalid protocol.')
}

module.exports = {
    TransmitFetcher, TransmitV1, TransmitV2, TransmitV3,
    TransmitCompound, createV1TransmitFetcher,
    createV2TransmitFetcher, createV3TransmitFetcher, createCompoundTransmitFetcher,
    createTransmitFetcher
}
