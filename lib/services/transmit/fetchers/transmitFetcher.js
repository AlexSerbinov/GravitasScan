"use ctrict"
const { getUsersFromDataFetcherSet } = require("../../../redis")
const { EventEmitter } = require("node:events")
const axios = require("axios")
const { ethers } = require("ethers")

/**
 * Abstract fetcher
 *
 * To request user data
 */
class TransmitFetcher extends EventEmitter {
  /**
   *
   * @param {*} settings - object that contains
   * services settings
   */
  constructor(settings) {
    super()
    this.settings = settings
    this.globalReservesData = null
    this.buffer = []
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
   * Simulate transaction after transmit event
   */
  async simulate(userToSimulate, rawTransmit) {
    let body = this._createBody(userToSimulate, rawTransmit)
    this.emit("info", { info: `simulation started` })
    let simulateResult = await axios.post(process.env.ENSO_URL, body)

    simulateResult.data.shift()
    this.emit("info", { info: `simulation passed` })
    return { simulateData: [...new Set([].concat(...simulateResult.data))], usersByAsset: userToSimulate, rawTransmit }
  }

  /**
   * filtered users by simulated hf
   */
  userToExecute(data) {
    const simulateData = data.simulateData
    const usersByAsset = data.usersByAsset
    const { minHfLiq, maxHfLiq } = this.settings
    let userToLiquidate = []
    const abiDecode = this.getABIDecode()
    const abiCoder = new ethers.utils.AbiCoder()

    for (let i = 0; i < simulateData.length; i++) {
      const decodeData = abiCoder.decode(abiDecode, simulateData[i].returnData)

      let hf = decodeData.CanLiquidate ? Number(decodeData.CanLiquidate) : decodeData.healthFactor / 1e18

      /**
       * Check hf
       */
      if (decodeData.CanLiquidate == 0) userToLiquidate.push({ user: usersByAsset[i], hf })
      if (hf < minHfLiq) {
        continue
      }
      if (hf > maxHfLiq) {
        continue
      }
      userToLiquidate.push({ user: usersByAsset[i], hf })
    }

    this.emit("info", {
      info: `${
        userToLiquidate.length == 0
          ? `user to liquidate not exist`
          : `users to Liquidate ${JSON.stringify(userToLiquidate)}`
      }`,
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
      const response = await this.simulate(userToSimulate, rawTransmit) // make request here
      this.emit("response", response)
    }
  }

  /**
   * create body for request
   */
  _createBody(userToSimulate, rawTransmit) {
    let helperOwner = process.env.HELPER_OWNER_PUBLIC_ADDRESS
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
