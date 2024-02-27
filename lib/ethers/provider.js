const { providers } = require("ethers")
const { createFallbackProvider } = require("./createFallbackProvider")

const { WebSocketProvider } = providers

let provider

if (process.env.RPC_MODE === "wss") {
  provider = new WebSocketProvider(process.env.RPC_WSS)
} else {
  provider = createFallbackProvider(process.env.RPC_HTTP.split(","))
}

module.exports = provider
