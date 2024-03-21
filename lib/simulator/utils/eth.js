'use strict'

/**
 * Get nonce by signer address
 * @param {string} address 
 * @param {Provider} provider - Provider from @ethers
 * @returns {number} - current nonce
 */
async function getNonce(address, provider) {
  return await provider.getTransactionCount(address)
}

/**
 * Get base fee for next block
 * @param {Provider} provider - Provider from @ethers
 * @returns {BigNumber}
 */
async function getBaseFee(provider) {
  const block = await provider.getBlock('latest')
  const gasUsed = BigInt(block.gasUsed)
  const gasLimit = BigInt(block.gasLimit)
  const baseFeePerGas = BigInt(block.baseFeePerGas)
  return calcNextBase(gasUsed, gasLimit, baseFeePerGas)
}

/**
 * Calculate base fee from 
 * current block parameters
 * @param {BigInt} gasUsed 
 * @param {BigInt} gasLimit 
 * @param {BigInt} baseFeePerGas 
 * @returns {BigInt} predictedBaseFee
 */
function calcNextBase(gasUsed, gasLimit, baseFeePerGas) {
  const denominator = 8n
  const targetGas = gasLimit / 2n
  const predictedBaseFee = baseFeePerGas + baseFeePerGas *
  (gasUsed - targetGas) / (targetGas * denominator)
  return predictedBaseFee
}

/**
 * Get timestamp for latest block
 * @param {Provider} provider - Provider from @ethers
 * @returns {number} latest block timestamp
 */
async function getLatestTimestamp(provider) {
  const block = await provider.getBlock('latest')
  const {timestamp} = block
  return timestamp
}

/**
 * Fetch access list
 * @param {*} tx - to get access list for
 * @param {Provider} provider - Provider from @ethers
 * @returns {*} access list for given transaction
 */
async function getAccessList(tx, provider) {
  const value = `0x${tx.value.toString(16)}`
  const type = '0x0'
  const gasPrice = '0x0'
  const chainId = '0x1'
  Object.assign(tx, {type, gasPrice, chainId, value})
  const request = [tx, 'latest']
  const resp = await provider.send('eth_createAccessList', request)
  const accessList = resp.accessList || []
  return accessList
}

/**
 * Get access list for unpacked swaps
 * @param {string} from - signer address
 * @param {string} to - contract address
 * @param {[*]} swaps - swaps array (frontrun or backrun...)
 * @param {number} blockNumber - block number for packer
 * @param {Provider} provider - ethers provider
 * @param {Function} pack - data-packer function
 * @returns {*} access list for given swaps
 */
async function getAccessListForSwaps(
  from, to, swaps, blockNumber,
  provider, pack
) {
  const {calldata, value} = pack(swaps, blockNumber)
  return getAccessList({
    from, to, value,
    data: calldata
  }, provider)
}

/**
 * Get transaction with calldata of get
 * balance of some token on given address
 * @param {string} token - token address
 * @param {string} address - we need to check balance
 * @returns {*} transaction object with required calldata
 */
function getBalanceTx(token, address, id) {
  return {
    chainId: 1,
    type: 2,
    from: address,
    to: token,
    data: `0x70a08231000000000000000000000000${address.slice(2)}`,
    gasLimit: 1000000,
    balanceRequest: true,
    id
  }
}

/**
 * Get contract call transaction
 * @param {string} from - signer address
 * @param {string} to - contract address
 * @param {string} data - call data
 * @param {BigInt} value - transaction value
 * @returns {*} transaction object
 */
function getContractCallTx(
  from, to, data, value,
  accessList, id
) {
  return {
    chainId: 1,
    type: 2,
    from,
    to,
    data,             
    gasLimit: 3000000,
    value: value.toString(),
    id,
    accessList
  }
}

/**
  * Get contract call transaction
  * @param {string} from - signer address
  * @param {string} to - contract address
  * @param {[*]} swaps - swaps array for data packer
  * @param {*} accessList - access list
  * @param {number} blockNumber 
  * @param {string} id - to mark transaction for simulation
  * @param {Function} pack - data-packer function
  * @returns {*} transaction object
  */
function getSwapsCallTx(
  from, to, swaps, accessList,
  blockNumber, id, pack
) {
  const {calldata, value} = pack(swaps, blockNumber)
  return getContractCallTx(
    from, to, calldata, value, accessList, id
  )
}

/**
 * Get contract call transaction with access list
 * @param {string} from - signer address
 * @param {string} to - contract address
 * @param {[*]} swaps - swaps array for data packer
 * @param {number} blockNumber 
 * @param {string} id - to mark transaction for simulation
 * @param {Provider} provider - ethers provider
 * @param {Function} pack - data-packer function
 * @returns 
 */
async function getSwapsCallTxAl(
  from, to, swaps, blockNumber,
  id, provider, pack
) {

  from = "0x0000C49AD90063b8dA1A7fC81c0003dc000AFe16"

  /**
   * Getting access list
   */
  const accessList = await getAccessListForSwaps(
    from, to, swaps, blockNumber,
    provider, pack
  )
  
  /**
   * Builduing transaction
   */
  const transaction = getSwapsCallTx(
    from, to, swaps, accessList,
    blockNumber + 1, id, pack
  )

  return transaction
}

module.exports = {
  getNonce, getBaseFee,
  getLatestTimestamp, getAccessList,
  getBalanceTx, getContractCallTx,
  getAccessListForSwaps, getSwapsCallTx,
  getSwapsCallTxAl
}
