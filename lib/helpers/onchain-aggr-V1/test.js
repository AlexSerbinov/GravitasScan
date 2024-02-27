"use strict"
const config = require("../../configs/Main.json")
Object.assign(process.env, config)

const { getHelper } = require(".")
const provider = require("../../ethers")

const helperV1 = getHelper("V1", provider)
helperV1.getGlobalReserves().then((res) => {
  const key = Object.keys(res)[0]
  const value = res[key]
	console.log("V1", key, value)
})

const helperV2 = getHelper("V2", provider)
helperV2.getGlobalReserves().then((res) => {
  const key = Object.keys(res)[0]
  const value = res[key]
  console.log("V2", key, value)
})

const helperV3 = getHelper("V3", provider)
helperV3.getGlobalReserves().then((res) => {
  const key = Object.keys(res)[0]
  const value = res[key]
  console.log("V3", key, value)
})

const helperCompound = getHelper("Compound", provider)
helperCompound.getGlobalReserves().then((res) => {
  const key = Object.keys(res)[0]
  const value = res[key]
  console.log("Compound", key, value)
})

helperCompound.getUserReserves('0x30471A7c9e3a8765e53a6257980eD3dcdA586312').then((res) => {
  const { reserves } = res
  for (const name in reserves)
  console.dir(reserves[name])
})
