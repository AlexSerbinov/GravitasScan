global.$ = $ // Use global.$ to enable the use of $ in other folders
require("../lib/helpers/config.helper")
const { createTransmitFetcher } = require("../lib/services/transmit/fetchers")
const { syncSettings } = require("../lib/helpers/config.helper")
const { configurePool } = require("../lib/ethers/pool")

// Define the protocol to use from service.json
const protocol = $.params.PROTOCOL

// Initialize Ethereum connection pool with WebSocket RPC endpoint
configurePool([process.env.RPC_WSS])

// Sync settings specific to the protocol being used, typically for fetching and executing transactions
const settings = await syncSettings(protocol, "searcher")

// Create a new instance of the transmit fetcher with the synced settings
let fetcher = createTransmitFetcher(protocol, settings)

fetcher.on("response", async data => {
    // Skip processing if there is no simulate data
    if (data.simulateData.length == 0) return
    // Determine users eligible for liquidation based on the fetched data
    let userToLiquidate = fetcher.userToExecute(data)
    if (userToLiquidate.length == 0) return
    // Execute liquidation for each eligible user
    userToLiquidate.forEach(userData => fetcher.executeUser(userData.user, userData.hf, data.rawTransmit))
})

// Event listener for liquidation events
fetcher.on("liquidate", data => {
    $.send("liquidate", data.resp)
})

// Event listener for additional information events
fetcher.on("info", data => {
    $.send("info", data)
})

// Event listener for delete events
fetcher.on("delete", data => {
    $.send("delete", data)
})

// Event listener for reject events
fetcher.on("reject", data => {
    $.send("reject", data)
})

// Event listener for error events
fetcher.on("error", data => {
    $.send("error", data)
})

// Custom event listener for receiving reserves data
$.on(`onReservesData`, data => {
    fetcher.setGlobalReservesData(data)
})

// Custom event listener for receiving updated settings
$.on(`onSettings`, settings => {
    fetcher.settings = settings
})

// Function to emit a start event, indicating the searcher has begun its operation
const sendStartEvent = function () {
    const date = new Date().toUTCString()
    $.send("start", { m: date })
}

sendStartEvent()

$.on("transmit", async data => {
    // Check if the transmitted data includes the specific protocol
    if (!Object.keys(data.assets).includes(protocol)) {
        return
    }
    // Fetch users by asset from Redis
    const usersByAssets = await fetcher.getUsersByAsset(data.assets[`${protocol}`])
    if (usersByAssets.length == 0) return
    usersByAssets.forEach((user, index) => {
        fetcher.request(user, data, index + 1 == usersByAssets.length)
    })
})

$.onExit(async () => {
    return new Promise(resolve => {
        setTimeout(() => {
            const { pid } = process
            console.log(pid, "Ready to exit.")
            resolve()
        }, 100) // Set a small timeout to ensure async cleanup can complete
    })
})
