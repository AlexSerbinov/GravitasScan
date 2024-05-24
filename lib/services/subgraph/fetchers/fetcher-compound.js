const { Fetcher } = require("./fetcher")
const { getHelper } = require("../../../helpers/onchain-aggregator")

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
  }
}
module.exports = { FetcherCompound }
