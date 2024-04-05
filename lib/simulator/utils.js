"use strict"
const axios = require("axios")

/**
 * Make transaction objects array
 * comparable with enso
 * @param {[*]} txs - transactions array
 * @param {number} blockNumber - block number simulate for
 * @param {number} blockTimestamp - latest block timestamp
 * @param {boolean} formatTrace - include formatted trace
 * to result or not
 * @param {*} stateOverrides -  Override blockchain
 * storage state for simulation
 * @returns {[*]} formated transactions bundle
 */
function prepareBundle(txs, blockNumber, blockTimestamp, formatTrace, stateOverrides) {
  const bundle = []
  for (const tx of txs) {
    const { type, from, to, gasLimit, value, accessList, data } = tx

    bundle.push({
      chainId: 1,
      type,
      from,
      to,
      formatTrace,
      data,
      blockTimestamp,
      blockNumber,
      gasLimit: gasLimit ? parseInt(gasLimit) : 3000000,
      value: value ? value.toString() : "0000000000",
      accessList: accessList ? accessList : [],
    })
  }

  /**
   * Overriding storage state in first
   * transaction in bundle
   */
  if (stateOverrides) Object.assign(bundle[0], { stateOverrides })

  return bundle
}

/**
  * Request simulation of transaction bundle
  * @param {[*]} txs - transaction objects array
  * @returns {*} example: [
    {
      simulationId: 1,
      totalGas: 205738,
      gasUsed: 205738,
      gasRefund: 0,
      blockNumber: 18291925,
      success: false,
      trace: [Array],
      formattedTrace: null,
      logs: [Array],
      exitReason: 'Revert',
      returnData: '0x01'
    }
  ]
  */
async function request(txs, url) {
  try {
    const result = await axios.post(url, txs)
    const { data } = result
    return data
  } catch (error) {
    if (error.response) {
      console.log(error.response)
      return error.response
    } else return error
  }
}

module.exports = {
  prepareBundle,
  request,
}
