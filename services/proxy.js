const fs = require("fs").promises
const EventEmitter = require("node:events")
const path = require("path")

const { SERVICE_STATUS } = require("../lib/constants")
const defaultSettings = require("../configs/DefaultSettings.json")
const redis = require("../lib/redis/redis/lib/redis")

const protocol = $.params.PROTOCOL

const configPath = $.params.configPath
const config = require(`${process.cwd()}${configPath}`)

const service = "proxy"

// We prepare redis here because only in this place we have config params. And we don't want to use global variables.
await redis.prepare(config.REDIS_HOST, config.REDIS_PORT) // Check if needed

const { checkUsersInBlacklistSet } = require("../lib/redis")

const settings = defaultSettings.find(s => s.protocol === protocol).services[service]

$.send("start", { message: "proxy started" })

/**
 * Create fetcher
 */

const fetcher = new EventEmitter()

// Handler for sending users to subgraph in batches.
fetcher.on("sendUsersToSubgraph", async data => {
  const nonBlacklistedUsers = await getNonBlacklistedUsers(protocol)
  await sendUsersToSubraphInBatches(nonBlacklistedUsers)
})

$.on("drain", () => {
  console.log("PROXY: recieved drain event from subgraph")
  onDrain()
})

// Utility function to read and parse the user file.
const getUserFromFile = async () => {
  const filePath = path.join(__dirname, "allUsers", "allUsersL.json")
  const items = await fs.readFile(filePath, "utf8")
  return JSON.parse(items)
}

// New utility function to get non-blacklisted users.
const getNonBlacklistedUsers = async protocol => {
  const allUsers = await getUserFromFile()
  const usersToCheck = allUsers.map(userInfo => userInfo.user)
  const checkBlacklistUsers = await checkUsersInBlacklistSet(usersToCheck, protocol)
  return allUsers.filter((_, index) => checkBlacklistUsers[index] === 0)
}

// Send users in batches.
const sendUsersToSubraphInBatches = async nonBlacklistedUsers => {
  const batchSize = 20
  for (let i = 0; i < nonBlacklistedUsers.length; i += batchSize) {
    const batch = nonBlacklistedUsers.slice(i, i + batchSize)
    if (i == nonBlacklistedUsers.length -1 )console.log(`PROXY: Sending batch number ${i/batchSize} of ${batch.length} users`)
    $.send("sendUsersToSubgraph", batch)
  }
}

const DRAIN_TIMEOUT_INITIAL = 30 * 1000 // 10 seconds for the first time
const DRAIN_TIMEOUT_REPEAT = 10 * 60 * 1000 // 10 min for subsequent times

let drainTimer
let manualTriggerCount = 0

const setupDrainTimer = () => {
  clearTimeout(drainTimer) // It's safe to call clearTimeout even if drainTimer is undefined

  const timeout = manualTriggerCount === 0 ? DRAIN_TIMEOUT_INITIAL : DRAIN_TIMEOUT_REPEAT
  drainTimer = setTimeout(() => {
    console.log(`Manually triggering drain after ${manualTriggerCount === 0 ? "10 seconds" : "10 min"} of inactivity.`)
    onDrain()
      .then(() => {
        manualTriggerCount++
        setupDrainTimer() // Reset the timer after successful drain
      })
      .catch(error => console.error("Drain failed:", error))
  }, timeout)
}

const onDrain = async () => {
  const nonBlacklistedUsers = await getNonBlacklistedUsers(protocol) // Ensure protocol is correctly defined or passed
  await sendUsersToSubraphInBatches(nonBlacklistedUsers)
}

// Start the initial drain timer upon script start
setupDrainTimer()

$.onExit(async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      const { pid } = process
      console.log(pid, "Ready to exit.")
      $.send("stop", { date })
      resolve()
    }, 100) // Set a small timeout to ensure async cleanup can complete
  })
})

fetcher.on("error", data => {
  $.send("error", data)
})

process.on("uncaughtException", error => {
  console.error(error)
  fetcher.emit("errorMessage", error)
})
