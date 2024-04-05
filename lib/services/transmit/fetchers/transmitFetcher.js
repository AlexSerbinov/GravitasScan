"use ctrict"
const { getUsersFromDataFetcherSet } = require("../../../redis")
const { EventEmitter } = require("node:events")
const axios = require("axios") //TODO @AlexSerbinov migrate to simulator.js
const { ethers } = require("ethers")

/**
 * Abstract fetcher
 *
 * To request user data
 */
class TransmitFetcher extends EventEmitter {
  /**
   * @param {*} settings - object that contains
   * services settings
   * @param {*} config - config object with all settings variables
   * @param {*} simulator - Interface for enso simulator
   */
  constructor(settings, config, simulator) {
    super()
    this.settings = settings
    this.globalReservesData = null
    this.buffer = []
    this.config = config
    this.simulator = simulator
  }

  /**
   * Update global reserves through
   * this method
   * @param {*} data - global reserves
   * @returns {Fetcher}
   */
  setGlobalReservesData(data) {
    this.globalReservesData = data
    return this
  }

  async executeUser(user, hf, rawTransmit) {
    if (!this.globalReservesData) {
      this.emit("error", { error })
      return
    }
    const resp = await this.execute(user, hf)

    const { liq } = resp
    if (liq) {
      this.emit("liquidate", { resp, rawTransmit })
    }
  }

  /**
   * return users by array of assets
   */
  async getUsersByAsset(assets) {
    let protocol = this.getProtocol()
    let usersFromRedis = []
    for (let i = 0; i < assets.length; i++) {
      let userFromReddis
      try {
        userFromReddis = await getUsersFromDataFetcherSet(protocol, assets[i])
      } catch {
        userFromReddis = []
      }
      usersFromRedis.push(userFromReddis)
    }
    const allUsers = [...new Set([].concat(...usersFromRedis))]
    this.emit("info", {
      info: `${allUsers.length !== 0 ? `users by asset from Redis ${allUsers}` : `users from redis not exist`}`,
    })
    return allUsers
  }

  /**
   * TODO: Check price movement to define wich direction to go (collateral or borrow)
   * const asset = rtx.asset
   *
   * const assetPriceBeforeRTX = simulate( body: [tx.calldata: 0x000...getAssetPrice] )
   * const assetPriceAfterRTX = simulate( body: [tx.calldata: 0x000...getAssetPrice] )
   *
   * if (assetPriceBeforeRTX > assetPriceAfterRTX) const movement = dropp
   *
   * if (movement == dropp) >> get users where asset is in collateral
   * else >> get users where asset is in borrow
   */

  /**
   * Simulate transaction after transmit event
   */
  async simulate(userToSimulate, rawTransmit) {
    let body = this._createBody(userToSimulate, rawTransmit)
    this.emit("info", { info: `simulation started` })

    let simulationResult = await this.simulator.simulate(body, rawTransmit.blockNumber, rawTransmit.blockTimestamp)
    this.emit("info", { info: `simulation passed` })

    let simulateData = []
    simulationResult.forEach((result, id) => {
      if (result.success) {
        simulateData.push(result)
      }
    })

    return { simulateData, usersByAsset: userToSimulate, rawTransmit }
  }

  /**
   * filtered users by simulated hf
   */
  // TODO delete consoles
  userToExecute(data) {
    const simulateData = data.simulateData
    const usersByAsset = data.usersByAsset
    const { minHfLiq, maxHfLiq } = this.settings
    let userToLiquidate = []
    const abiDecode = this.getABIDecode()
    const abiCoder = new ethers.utils.AbiCoder()

    console.log("Settings - Min HF:", minHfLiq, "Max HF:", maxHfLiq)
    this.emit("info", `Settings - Min HF: ${minHfLiq}, Max HF: ${maxHfLiq}`)

    for (let i = 0; i < simulateData.length; i++) {
      const decodeData = abiCoder.decode(abiDecode, simulateData[i].returnData)
      let hf = decodeData.CanLiquidate ? Number(decodeData.CanLiquidate) : decodeData.healthFactor / 1e18

      if (decodeData.CanLiquidate == 0) {
        userToLiquidate.push({ user: usersByAsset[i], hf })
      }
      if (hf < minHfLiq || hf > maxHfLiq) {
        continue
      }

      userToLiquidate.push({ user: usersByAsset[i], hf })
    }

    console.log("Users to Liquidate:", userToLiquidate)

    this.emit("info", {
      info: `${userToLiquidate.length == 0 ? `user to liquidate not exist` : `users to Liquidate ${JSON.stringify(userToLiquidate)}`}`,
    })

    return userToLiquidate
  }

  /**
   * create request for simulate every 50 users
   */
  async request(user, rawTransmit, last) {
    this.buffer.push(user)
    if (this.buffer.length >= 50 || last) {
      const userToSimulate = this.buffer
      this.buffer = []
      const response = await this.simulate(userToSimulate, rawTransmit)
      this.emit("response", response)
    }
  }

  /**
   * create body for request
   */
  _createBody(userToSimulate, rawTransmit) {
    let helperOwner = this.config.HELPER_OWNER_PUBLIC_ADDRESS
    let lendingPool = this.getLendingPool()
    let dataPrefix = this.getDataPrefix()
    let body = [
      {
        chainId: Number(rawTransmit.chainId),
        from: rawTransmit.from,
        to: rawTransmit.to,
        data: rawTransmit.data,
        gasLimit: Number(rawTransmit.gasLimit),
        value: rawTransmit.value.toString(),
      },
    ]

    for (let j = 0; j < userToSimulate.length; j++) {
      let userSlicetwo = userToSimulate[j].slice(2)
      let data = `${dataPrefix}${userSlicetwo}`
      body.push({
        chainId: Number(1),
        from: helperOwner,
        to: lendingPool,
        data: data,
        gasLimit: Number(30000000),
        value: "0",
      })
    }
    return body
  }

  /**
   * Implement execution in the child class
   */
  execute() {
    throw new Error("Method not implemented.")
  }
}

module.exports = { TransmitFetcher }
