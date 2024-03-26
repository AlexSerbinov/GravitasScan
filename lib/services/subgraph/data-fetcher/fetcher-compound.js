const { Fetcher } = require("./fetcher")
const { getHelper } = require("../../../helpers/onchain-aggr-V1")

class FetcherCompound extends Fetcher {
  /**
   * Constructs the FetcherCompound object.
   * @param {object} params - The parameters for the fetcher.
   * @param {object} settings - The settings for the fetcher.
   * @param {object} config - The configuration for the fetcher.
   * @param {object} simulator - The simulator insctanse.
   */
  constructor(params, settings, config, simulator) {
    super(params, settings, config, simulator)
    // TODO can be deleted below this line?
    this.config = config
    this.params = params
    this.helperContract = getHelper(this.params.protocol, this.provider, this.config)
    this.simulator = simulator
  }

  /**
   * Retrieves users' data by simulating transactions for the given addresses.
   * @param {Array} addresses - The addresses to get data for.
   * @param {number} blockTag - The block number to execute the transaction.
   * @param {number} blockTimestamp - The timestamp of the block.
   * @returns {Array} The users' data.
   */
  async getUsersData(addresses, blockTag, blockTimestamp) {
    const resp = await this.prepareTransaction(addresses, blockTag, blockTimestamp)
    // if (resp[0].user) console.log(`usersData success received from simulator`)
    // else
    //   console.log(`usersData failed to
    // receive from simulator`)
    return resp
  }

  // TODO: can be deleted because we have one in fetcher global
  //   /**

  //     Updates the global reserves data in the helper contract and triggers the 'fetcherReady' event.
  //     @param {*} data - The global reserves data to be set.
  //     @returns {FetcherCompound} The instance of this FetcherCompound.
  //     */
  //   setGlobalReservesData(data) {
  //     this.globalReservesData = data
  //     this.helperContract.setGlobalReserves(data)
  //     this.emit("fetcherReady", {})
  //     return this
  //   }
}
module.exports = { FetcherCompound }
