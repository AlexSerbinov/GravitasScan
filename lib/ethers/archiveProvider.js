const { providers } = require("ethers")
const { createFallbackProvider } = require("./createFallbackProvider")

const { WebSocketProvider } = providers

const getArchiveProvider = () => {
  if (process.env.ARCHIVE_RPC_MODE === "wss") {
    return new WebSocketProvider(process.env.ARCHIVE_RPC_WSS)
  }
  return createFallbackProvider(process.env.ARCHIVE_RPC_HTTP.split(","))
}

module.exports = {
  getArchiveProvider,
}
