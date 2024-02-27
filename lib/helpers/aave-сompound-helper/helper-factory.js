'use strict'
const { HelperV1 } = require("./helper-v1");
const { HelperV2 } = require("./helper-v2");
const { HelperV3 } = require("./helper-v3");
const { HelperCompound } = require("./helper-compound");

/**
 * Factories
 * @param {Provider} provider 
 * @returns {HelperBase} The helper instance
 */
const createHelperV1 = provider => new HelperV1(provider);
const createHelperV2 = provider => new HelperV2(provider);
const createHelperV3 = provider => new HelperV3(provider);
const createHelperCompound = provider => new HelperCompound(provider);

/**
 * Factory function to get the appropriate helper class
 * @param {string} version - The version of the protocol ('V1', 'V2', 'V3' or 'Compound')
 * @param {Provider} provider - ethers/Provider
 * @returns {HelperBase} The helper instance
 */
function getHelper(version, provider) {
  switch(version) {
    case 'V1':
      return createHelperV1(provider);
    case 'V2':
      return createHelperV2(provider);
    case 'V3':
      return createHelperV3(provider);
    case 'Compound':
      return createHelperCompound(provider);
    default:
      throw new Error(`Unsupported protocol version: ${version}`);
  }
}

module.exports = { getHelper, createHelperV1, createHelperV2, createHelperV3, createHelperCompound };
