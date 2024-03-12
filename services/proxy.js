const fs = require("fs").promises
const EventEmitter = require("node:events")
const path = require("path")
const redis = require("../lib/redis/redis/lib/redis")

const protocol = $.params.PROTOCOL

const configPath = $.params.configPath
const config = require(`${process.cwd()}${configPath}`)
const fetcher = new EventEmitter()

// We prepare redis here because only in this place we have config params. And we don't want to use global variables.
await redis.prepare(config.REDIS_HOST, config.REDIS_PORT) // Check if needed
const { checkUsersInBlacklistSet } = require("../lib/redis")

const DRAIN_TIMEOUT_REPEAT = 50 * 60 * 1000 // 5 min ! after this time, send batch of user when drain event not received

$.send("start", { message: "proxy started" })

let isSending = false // Flag to indicate if sending is in progress
let lastDrainTimestamp = Date.now() // Time of the last drain event

/**
 * Create fetcher
 */

// Handler for sending users to subgraph in batches.
fetcher.on("sendUsersToSubgraph", async data => {
  const nonBlacklistedUsers = await getNonBlacklistedUsers(protocol)
  await sendUsersToSubraphInBatches(nonBlacklistedUsers)
})

/**
 * Create listener
 */

$.on("drain", () => {
  const currentTime = Date.now()
  const timeSinceLastDrain = (currentTime - lastDrainTimestamp) / 1000 // Time between drain events in seconds
  console.log(`PROXY: ${protocol} Received  drain event from subgraph. Time since last drain: ${timeSinceLastDrain} seconds.`)
  lastDrainTimestamp = currentTime

  if (!isSending) {
    onDrain()
  }
})

const onDrain = async () => {
  isSending = true
  const nonBlacklistedUsers = await getNonBlacklistedUsers(protocol) // Ensure protocol is correctly defined or passed
  await sendUsersToSubraphInBatches(nonBlacklistedUsers)
  isSending = false
}

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
  isSending = true // Set the sending flag to true at the beginning
  const batchSize = 20
  const totalBatches = Math.ceil(nonBlacklistedUsers.length / batchSize)

  for (let i = 0; i < nonBlacklistedUsers.length; i += batchSize) {
    // Use setImmediate for asynchronous sending
    setImmediate(async () => {
      const batch = nonBlacklistedUsers.slice(i, i + batchSize)
      const batchNumber = i / batchSize + 1

      // Check if the current batch is the last one
      if (batchNumber === totalBatches) {
        console.log(`\nPROXY: Sending the last batch number ${batchNumber} of users`)
        $.send("proxy_logs", { message: `Sending the last batch number ${batchNumber} of users` })
      }

      $.send("sendUsersToSubgraph", batch)

      if (i + batchSize >= nonBlacklistedUsers.length) {
        isSending = false // Reset the sending flag after the last iteration
      }
    })
  }
}

let drainTimer
let manualTriggerCount = 0

const setupDrainTimer = () => {
  clearTimeout(drainTimer) // It's safe to call clearTimeout even if drainTimer is undefined

  drainTimer = setTimeout(() => {
    console.log("Manually triggering drain after 10 min of inactivity.")
    if (manualTriggerCount >= 10)
      $.send("proxy_logs", { message: `manualTriggerCount = ${manualTriggerCount}! Executes to offen. Something with drain event` })
    onDrain()
      .then(() => {
        manualTriggerCount++
        setupDrainTimer() // Reset the timer after successful drain
      })
      .catch(error => console.error("Drain failed:", error))
  }, DRAIN_TIMEOUT_REPEAT)
}

// Initiate the main functionality immediately upon script start
onDrain()
// Start the drain timer
setupDrainTimer()

$.onExit(async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      const { pid } = process
      console.log(pid, "Ready to exit.")
      $.send("stop", { date: new Date() })
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
