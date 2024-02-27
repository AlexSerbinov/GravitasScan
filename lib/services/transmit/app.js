const { createTransmitFetcher } = require('./fetchers')
const { syncSettings } = require('../../helpers/config.helper')
const { onTransmit } = require("./mq")
const {
    sendRejectEvent,
    sendErrorEvent,
    sendLiquidateCommand,
    sendTransmitFetcherEvent,
    onReservesData,
    onSettings,
    sendStartEvent,
    sendStopEvent } = require('./mq')
    const {configurePool} = require("../../ethers/pool")

configurePool([process.env.RPC_WSS])
/**
* Initiate
*/
const start = async () => {
    const protocol = process.env.PROTOCOL
    const settings = await syncSettings(protocol, 'searcher')

    /**
     * Initiate
     */
    const fetcher = createTransmitFetcher(protocol, settings)

    /**
    * Listening
    */
    onTransmit(protocol, async data => {
        
        if (!Object.keys(data.assets).includes(protocol)) return
        
        sendTransmitFetcherEvent("info", { info: `Assets from transmit: ${data.assets[`${protocol}`]} ` })
        const usersByAssets = await fetcher.getUsersByAsset(data.assets[`${protocol}`])
        
        if (usersByAssets.length == 0) return
        usersByAssets.forEach((user, index) => {
            if (index + 1 == usersByAssets.length) fetcher.request(user, data, true)
            else fetcher.request(user, data, false)
        });
    })

    fetcher.on('response', async data => {
        if (data.simulateData.length == 0) return
        let userToLiquidate = fetcher.userToExecute(data)
        if (userToLiquidate.length == 0) return
        userToLiquidate.forEach(userData => fetcher.executeUser(userData.user, userData.hf, data.rawTransmit));
    })

    /**
     * When user liquidates
     */
    fetcher.on('liquidate', data => {
        sendLiquidateCommand(data)
    })

    /**
    * additional info
    */
    fetcher.on('info', data => {
        sendTransmitFetcherEvent("info", data)
    })

    /**
    * When user delete
    */
    fetcher.on('delete', data => {
        sendTransmitFetcherEvent("delete", data)
    })


    /**
     * else
     */
    fetcher.on('reject', data => sendRejectEvent(data))
    fetcher.on('error', data => sendErrorEvent(data))

    /**
     * Listening
     */
    onReservesData(protocol, data => {
        fetcher.setGlobalReservesData(data)
    })

    onSettings(settings => {
        fetcher.settings = settings
    })

    sendStartEvent()
}
/**
 * When searcher stops
 */
const stop = () => sendStopEvent()

/**
 * Send uncaughtException as event
 */
process.on('uncaughtException', sendErrorEvent)

module.exports = { start, stop }
