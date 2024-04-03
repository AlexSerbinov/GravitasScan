"use strict"
const { assert } = require("../utils/assert")
const { prepareBundle, request } = require("./utils")

/**
 * Interface for enso transaction simulator
 */
class Simulator {
  /**
   * @param {string} url - enso simulator url
   * @param {boolean} formatTrace - include formatted trace
   * @param {*} stateOverrides - Override blockchain
   * storage state for simulation
   */
  constructor(url, formatTrace, stateOverrides) {
    assert(url, "URL is required.", "system", { url })
    this.url = url
    this.formatTrace = formatTrace || false
    this.stateOverrides = stateOverrides || null
  }

  /**
   * Simulate transactions bundle by enso
   * @param {[*]} transactions - transaction for simulation
   * @param {number} blockNumber - block number simulation for
   * @param {number} blockTimestamp - latest block timestamp
   * @returns {Map} id -> simulation result
   * {
        blockNumber, blockTimestamp,
        gasUsed, totalGas,
        returnData, success,
        formattedTrace
      }
   */
  async simulate(transactions, blockNumber, blockTimestamp) {
    const { url, formatTrace, stateOverrides } = this

    /**
     * Prepare
     */
    const bundle = prepareBundle(transactions, blockNumber, blockTimestamp, formatTrace, stateOverrides)

    /**
     * Simulate
     */
    try {
      const response = await request(bundle, url)
      
      /**
       * Map of simulation results by id
       */
      const result = new Map()

      /**
       * Fill result map
       */
      if(response.error) console.log('errrrrrrrror')
      response.forEach((simulation, index) => {
        const { success, formattedTrace } = simulation
        const gasUsed = BigInt(simulation.gasUsed)
        const totalGas = BigInt(simulation.totalGas)
        const returnData = simulation.returnData === "0x" ? 0n : simulation.returnData
        const transaction = transactions[index]
        const { id } = transaction
        result.set(id, {
          blockNumber,
          blockTimestamp,
          gasUsed,
          totalGas,
          returnData,
          success,
          formattedTrace,
          transaction,
        })
      })

      return result
    } catch (error) {
      console.error(`Simulator error: ${error}`)
      return new Map()
    }
  }
}

/**
 * @param {string} url - enso simulator url
 * @param {boolean} formatTrace - include formatted trace
 * @param {*} stateOverrides - Override blockchain
 * storage state for simulation
 */
const createSimulator = (url, formatTrace, stateOverrides) => new Simulator(url, formatTrace, stateOverrides)
module.exports = { createSimulator, Simulator }
