require("../lib/helpers/config.helper")
const { createTransmitFetcher } = require("../lib/services/transmit/fetchers")
const { syncSettings } = require("../lib/helpers/config.helper")
const { configurePool } = require("../lib/ethers/pool")

const protocol = $.params.PROTOCOL

configurePool([process.env.RPC_WSS])
const settings = await syncSettings(protocol, "searcher")
let fetcher = createTransmitFetcher(protocol, settings)

fetcher.on("response", async data => {
  if (data.simulateData.length == 0) return
  let userToLiquidate = fetcher.userToExecute(data)
  if (userToLiquidate.length == 0) return
  userToLiquidate.forEach(userData => fetcher.executeUser(userData.user, userData.hf, data.rawTransmit))
})

fetcher.on("liquidate", data => {
  $.send("liquidate", data.resp)
})

fetcher.on("info", data => {
  $.send("info", data)
})

fetcher.on("delete", data => {
  $.send("delete", data)
})

fetcher.on("reject", data => {
  $.send("reject", data)
})

fetcher.on("error", data => {
  $.send("error", data)
})

$.on(`onReservesData`, data => {
  fetcher.setGlobalReservesData(data)
})

$.on(`onSettings`, settings => {
  fetcher.settings = settings
})

const sendStartEvent = function () {
  const date = new Date().toUTCString()
  $.send("start", { m: date })
}

sendStartEvent()

$.on("data/eth/pending/transmit_assets", async data => {
  if (!Object.keys(data.assets).includes(protocol)) {
    return
  }

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
