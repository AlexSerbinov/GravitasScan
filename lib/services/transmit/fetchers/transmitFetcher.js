"use ctrict"
const { getUsersFromDataFetcherSet } = require("../../../redis")
const { EventEmitter } = require("node:events")
const { ethers } = require("ethers")

const {
  USERS_FROM_REDIS_TO_SIMULATION_BY_ASSEST,
  ALL_UNIQUE_USERS_FROM_REDIS_TO_SIMULATION,
  SIMULATION_PASSED_WITH_STATUS_SUCCESS,
  SIMULATION_PASSED_WITH_STATUS_FAILED,
  SIMULATION_ERROR,
  USER_SKIPPED_BY_LOW_HF,
  USER_SKIPPED_BY_HIGH_HF,
  NO_USERS_TO_EXECUTE,
  USERS_TO_EXECUTE,
  USER_ACCEPTED,
} = require("../../../../configs/eventTopicsConstants")
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
      this.emit("error", "global reserves data not set")
      return
    }
    const resp = await this.execute(user, hf)

    const { liq } = resp ? resp : {}

    if (liq) {
      this.emit("liquidate", { resp, rawTransmit })
    }
  }

  /**
   * return users by array of assets
   */
  async getUsersByAsset(assets) {
    try {
      let protocol = this.getProtocol()
      let usersFromRedis = []

      for (let i = 0; i < assets.length; i++) {
        let asset = assets[i]
        let userFromReddis
        try {
          userFromReddis = await getUsersFromDataFetcherSet(protocol, asset)
        } catch {
          userFromReddis = []
        }
        usersFromRedis.push(userFromReddis)

        this.emit("info", `Users by asset: ${asset} | users: ${userFromReddis.length !== 0 ? userFromReddis : "no users from redis by given asset"}`, USERS_FROM_REDIS_TO_SIMULATION_BY_ASSEST)
        // TODO: look deeply in the logs. If user showed in logs (user_skipped_by_hf), than maybe no need to send users from redis to logs
      }

      const allUsers = [...new Set([].concat(...usersFromRedis))]

      this.emit("info", `all unique users: ${allUsers.length !== 0 ? allUsers : "no users from redis by given asset"}`, ALL_UNIQUE_USERS_FROM_REDIS_TO_SIMULATION)

      return allUsers
    } catch (error) {
      console.log(error)
    }
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
    try {
      let body = this._createBody(userToSimulate, rawTransmit)

      let simulationResult = await this.simulator.simulate(body, rawTransmit.blockNumber, rawTransmit.blockTimestamp)
      let simulateData = []
      simulationResult.forEach((result, id) => {
        if (result.success) {
          this.emit("info", `simulation passed with success status`, SIMULATION_PASSED_WITH_STATUS_SUCCESS)
          simulateData.push(result)
        } else {
          this.emit("info", `simulation failed with error status`, SIMULATION_PASSED_WITH_STATUS_FAILED)
        }
      })

      return { simulateData, usersByAsset: userToSimulate, rawTransmit }
    } catch (error) {
      this.emit("errorMessage", error.message || error, SIMULATION_ERROR)
      throw error
    }
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

    // console.log("Settings - Min HF:", minHfLiq, "Max HF:", maxHfLiq)
    // this.emit("info", `Settings - Min HF: ${minHfLiq}, Max HF: ${maxHfLiq}`)

    for (let i = 0; i < simulateData.length; i++) {
      const decodeData = abiCoder.decode(abiDecode, simulateData[i].returnData)

      let hf = decodeData.CanLiquidate ? Number(decodeData.CanLiquidate) : decodeData.healthFactor / 1e18 // TODO: find out why on Compound CanLiquidate == 0, and what is mean

      if (decodeData.CanLiquidate == 0) {
        userToLiquidate.push({ user: usersByAsset[i], hf })
      }
      // console.log(`1----=-----=----=----=----=----=----- userss -----=-----=-----=-----=-- 1`)
      // console.log(`${usersByAsset[i]}, hf: ${hf}`);
      // console.log(`2----=-----=----=----=----=----=----- userss -----=-----=-----=-----=-- 2`)
      
      if (hf < minHfLiq) {
        // if (hf > minHfLiq * 0.25) {
          this.emit("info", `user: ${usersByAsset[i]} [skipped], HF: ${hf}, minHf: ${minHfLiq}`, USER_SKIPPED_BY_LOW_HF)
        // }
        continue
      }
      if (hf > maxHfLiq) {
        // if (hf < maxHfLiq * 2) {
          this.emit("info", `user: ${usersByAsset[i]} [skipped], HF: ${hf}, maxHfLiq: ${maxHfLiq}`, USER_SKIPPED_BY_HIGH_HF)
        // }
        continue
      }

      userToLiquidate.push({ user: usersByAsset[i], hf })
      this.emit("info", `user: ${usersByAsset[i]} [accepted], HF: ${hf}, maxHfLiq: ${maxHfLiq}, minHf: ${minHfLiq}`, USER_ACCEPTED)

    }

    if (userToLiquidate.length === 0) {
      this.emit("info", "no users to execute (find suitable borrow and collateral)", NO_USERS_TO_EXECUTE)
    } else {
      this.emit("info", `users to execute (find suitable borrow and collateral) ${JSON.stringify(userToLiquidate)}`, USERS_TO_EXECUTE)
    }

    return userToLiquidate
  }

  /**
   * create request for simulate every 50 users
   */
  async request(user, rawTransmit, last) {
    try {
      this.buffer.push(user)
      if (this.buffer.length >= 30 || last) {
        const userToSimulate = this.buffer
        this.buffer = []
        const response = await this.simulate(userToSimulate, rawTransmit)
        this.emit("response", response)
      }
    } catch (error) {
      throw error
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
