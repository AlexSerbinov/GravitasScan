'use strict'
const {utils} = require('ethers')

/**
 * Serializer for type 0, 1, null
 * @param {*} tx - transaction struct
 * @returns {string} - hex string of transaction
 */
function serializeLegacy(tx) {
  const {
    to, nonce, gasPrice,
    gasLimit, data, value,
    signature
  } = tx
  return utils.serializeTransaction({
    chainId: 1,
    to, nonce, data,
    gasLimit: BigInt(gasLimit),
    gasPrice: BigInt(gasPrice),
    value: BigInt(value)
  }, signature)
}

/**
 * Serializer for type 2
 * @param {*} tx - transaction struct
 * @returns {string} - hex string of transaction
 */
function serializeLondon(tx) {
  const {
    to, nonce, data,
    gasLimit, maxPriorityFeePerGas,
    maxFeePerGas, value,
    signature
  } = tx
  return utils.serializeTransaction({
    chainId: 1,
    type: 2,
    to, nonce, data,
    gasLimit: BigInt(gasLimit),
    maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas),
    maxFeePerGas: BigInt(maxFeePerGas),
    value: BigInt(value),
  }, signature)
}

/**
 * Serializer for type 0, 1, 2
 * @param {*} tx - transaction struct
 * @returns {string} - hex string of transaction
 */
function serializeTx(tx) {
  const {type} = tx
  if (type == 2) return serializeLondon(tx)
  return serializeLegacy(tx)
}

/**
 * Serializer for type 0, 1, 2
 * @param {[*]} txs - array of transactions
 * @returns {[string]} - array of serialized transactions
 */
function serializeTxs(txs) {
  const serialized = []
  for (const tx of txs)
  serialized.push(serializeTx(tx))
  return serialized
}

module.exports = {
  serializeLegacy, serializeLondon, serializeTx,
  serializeTxs
}
