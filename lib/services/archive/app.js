const { onBlock, sendFetchedUsersEvent, sendStartEvent } = require("./mq")
const { getFetcher } = require("./fetcher")
const { getLatestDbBlock, saveUsersToArchive } = require("./utils")
const {configurePool} = require("../../ethers/pool")

configurePool([process.env.RPC_WSS])
/**
 * Init
 */
const startArchive = async (protocol) => {
  const archiveBlockDiff = process.env.ARCHIVE_BLOCKS_DIFF || 10

  /**
   * Create fetcher instance by protocol
   */
  const fetcher = getFetcher(protocol)

  sendStartEvent({
    message: `Run fetching -archive_users-, For listen users connect to mqtt channel -event:archive_users:archive:${protocol}-`,
  })

  /**
   * Get latest archive block
   */
  let latestArchiveBlock = await getLatestDbBlock(protocol)

  /**
   * Listen latest db block from network
   */
  onBlock((data) => {
    const { number } = data
    /**
     * Start fetching
     */
    if (!fetcher.inProgress && number - latestArchiveBlock > archiveBlockDiff) {
      fetcher.start(latestArchiveBlock, number)
      sendStartEvent({
        message: `${protocol} archive start fetching users from ${latestArchiveBlock} to ${number} block`,
      })
    }
  })

  /**
   * Handle events from fetcher
   */
  fetcher.on("fetch", async (data) => {
    const { users, toBlock } = data
    await saveUsersToArchive(protocol, toBlock, users, "archive_users")
    sendFetchedUsersEvent(users)
  })

  fetcher.on("finished", (data) => {
    const { latestBlock } = data
    latestArchiveBlock = latestBlock
  })
}

module.exports = {
  startArchive,
}
