const { BigNumber } = require("ethers")
const { Fetcher } = require("./fetcher")

/* Helper contract */
const { getHelper } = require("../../../helpers/onchain-aggr-V1")
const axios = require("axios") // dev only. delete after testing
const { ethers } = require("ethers")

class FetcherCompound extends Fetcher {
  constructor(params, settings, config) {
    super(params, settings, config)
    this.config = config
    this.params = params
    this.helperContract = getHelper(this.params.protocol, this.provider, this.config)
    this.contract = null
  }

  async prepareTransaction(addresses, blockTag) {
    // console.log(`1----=-----=----=----=----=----=----- addresses -----=-----=-----=-----=-- 1`)
    // console.log(addresses)
    // console.log(`2----=-----=----=----=----=----=----- addresses -----=-----=-----=-----=-- 2`)

    let txn = {
      chainId: 1,
      from: "0xa83114A443dA1CecEFC50368531cACE9F37fCCcb", // state overide helper owner
      to: this.params.stateOverrides.contractAddress, // state overide helper address
      gasLimit: 300000000000000000,
      data: await this.encode(addresses), // this.protocol can be V1, V2, V3, COMPOUND
      blockNumber: blockTag,
      stateOverrides: {
        [this.params.stateOverrides.contractAddress]: {
          code: this.params.stateOverrides.code,
        },
      },
      formatTrace: true,
      // value: "0",
    }

    // // Save txn to file
    //  const fs = require("fs")
    // const path = "/Users/serbinov/Desktop/projects/cyBridge/ETH_LiqRegistry_V2/lib/services/subgraph/data-fetcher/txn.json"
    // fs.writeFileSync(path, JSON.stringify(txn, null, 2))

    const bundle = [txn]

    const resp = await axios.post(`http://10.10.13.7:7778/api/v1/simulate-bundle`, bundle)

    const formattedResults = []

    resp.data.forEach((data, index) => {
      const returnData = data.returnData
      const decodedABI = ["tuple(address user,uint256 totalCollateralETH,uint256 totalBorrowsETH,uint256 healthFactor)[]"]

      const decodedData = ethers.AbiCoder.defaultAbiCoder().decode(decodedABI, returnData)

      for (let i = 0; i < decodedData[0].length; i++) {
        formattedResults.push({
          user: decodedData[0][i][0],
          totalCollateralETH: decodedData[0][i][1].toString(),
          totalBorrowsETH: decodedData[0][i][2].toString(),
          healthFactor: decodedData[0][i][3].toString(),
        })
      }
    })
    // console.log(`1----=-----=----=----=----=----=----- formattedResults -----=-----=-----=-----=-- 1`)
    // console.log(formattedResults)
    // console.log(`2----=-----=----=----=----=----=----- formattedResults -----=-----=-----=-----=-- 2`)

    return formattedResults
  }

  async encode(addresses) {
    // console.log(`encode func addresses.length:`, addresses.length)
    return this.params.selector + ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [addresses]).substring(2)
  }

  async getUsersData(addresses, blockTag) {
    const resp = await this.prepareTransaction(addresses, blockTag)
    if (resp[0].user) console.log(`usersData success recieved from simulator`) // dev
    else console.log(`usersData failed to recieve from simulator`) // dev

    return resp
  }

  /**
   * Update global reserves through
   * this method
   * @param {*} data - global reserves
   * @returns {Fetcher}
   */
  setGlobalReservesData(data) {
    this.globalReservesData = data
    this.helperContract.setGlobalReserves(data)
    this.emit("fetcherReady", {})
    return this
  }
}

module.exports = { FetcherCompound }
