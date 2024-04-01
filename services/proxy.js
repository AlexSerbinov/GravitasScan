const fs = require("fs").promises
const EventEmitter = require("node:events")
const path = require("path")
const redis = require("../lib/redis/redis/lib/redis")
const filePath = path.join(__dirname, "allUsers", "allUsers40.json")
const { getArchiveData } = require("../lib/redis/index")

const protocol = $.params.PROTOCOL

const configPath = $.params.configPath
const config = require(`${process.cwd()}${configPath}`)
const fetcher = new EventEmitter()

// We prepare redis here because only in this place we have config params. And we don't want to use global variables.
await redis.prepare(config.REDIS_HOST, config.REDIS_PORT) // Check if needed
const { checkUsersInBlacklistSet } = require("../lib/redis")

const SEND_WITHOUT_DRAIN_TIMEOUT = 60 * 60 * 1000 // 60 min ! after this time, send batch of user when drain event not received //TODO @AlexSerbinov move to params

$.send("start", { message: "proxy started" })

let isSending = false // Flag to indicate if sending is in progress

/**
 * Handles the 'sendUsersToSubgraph' event by fetching non-blacklisted users
 * and sending them to the subgraph in batches.
 */
fetcher.on("sendUsersToSubgraph", async () => {
  const nonBlacklistedUsers = await getNonBlacklistedUsers(protocol)
  await sendUsersToSubraphInBatches(nonBlacklistedUsers)
})

/**
 * Listener for 'drain' events to manage sending users to the subgraph.
 * It keeps track of the time and count of drain events to ensure timely processing.
 */
let lastDrainTime = Date.now() // Initialize lastDrainTime to the current time
let drainEventCount = 0 // Counter for drain events

$.on("drain", data => {
  console.log(`drain called`)
  if (!isSending) {
    drainEventCount++
    console.log(`drainEventCount = ${drainEventCount}`)
    if (drainEventCount === data.forks) {
      const currentTime = Date.now()
      lastDrainTime = currentTime // Update lastDrainTime
      const elapsedSinceLastDrain = (currentTime - lastDrainTime) / 1000 // Time in seconds
      console.log(`Received expected number of drain events: ${data.forks}`)
      drainEventCount = 0 // Reset the counter after reaching the expected number of drain events
      console.log(
        `PROXY: Received drain event at ${new Date(currentTime).toISOString()}, ${elapsedSinceLastDrain.toFixed(2)} seconds since last drain.`
      )
      console.log(`PROXY: ${protocol} Received  drain event from subgraph. Flag isSending = ${isSending}`)
      $.send("proxy_logs", { message: `PROXY: ${protocol} Received  drain event from subgraph. Flag isSending = ${isSending}` })
      clearTimeout(drainTimer) // Reset the drain timer because of receiving the drain event
      onDrain()
    }
  }
})

/**
 * Triggered upon receiving a drain event, this function fetches non-blacklisted users
 * and sends them to the subgraph in batches.
 */
const onDrain = async () => {
  isSending = true
  const nonBlacklistedUsers = await getNonBlacklistedUsers(protocol)
  await sendUsersToSubraphInBatches(nonBlacklistedUsers)
  isSending = false
}

/**
 * Retrieves non-blacklisted users for the given protocol.
 * @param {string} protocol - The protocol identifier.
 * @returns {Promise<Array<string>>} An array of non-blacklisted user addresses.
 */
const getNonBlacklistedUsers = async protocol => {
  const allUsers = await getArchiveUsers(protocol)

  const usersToCheck = allUsers.map(userInfo => userInfo.user)
  console.log(`all users length = ${usersToCheck.length}`)
  const checkBlacklistUsers = await checkUsersInBlacklistSet(usersToCheck, protocol)

  const nonBlacklistedUsers = allUsers.filter((_, index) => checkBlacklistUsers[index] === 0).map(userInfo => userInfo.user) // Mapping to get only user addresses
  console.log(`nonBlacklistedUsers users length = ${nonBlacklistedUsers.length}`)

  return nonBlacklistedUsers
}

/**
 * Fetches users from the archive or subgraph for the given protocol.
 * @param {string} protocol - The protocol identifier.
 * @returns {Promise<Array<string>>} An array of user addresses.
 */
const getArchiveUsers = async protocol => {
  const allUsers = await getArchiveData(protocol, "archive_users")
  // Extract the arrays and flatten them into a single array
  const users = Object.values(allUsers).flat()
  return users
}

/**
 * Sends the non-blacklisted users to the subgraph in batches.
 * @param {Array<string>} nonBlacklistedUsers - An array of non-blacklisted user addresses.
 */
const sendUsersToSubraphInBatches = async nonBlacklistedUsers => {
  isSending = true // Set the sending flag to true at the beginning
  const batchSize = 20 //TODO @AlexSerbinov  move to params
  const totalBatches = Math.ceil(nonBlacklistedUsers.length / batchSize)
  let batchesSent = 0

  for (let i = 0; i < nonBlacklistedUsers.length; i += batchSize) {
    // Use setImmediate for asynchronous sending
    setImmediate(async () => {
      const batch = nonBlacklistedUsers.slice(i, i + batchSize)
      const batchNumber = i / batchSize + 1

      // Check if the current batch is the last one
      if (batchNumber === totalBatches) {
        $.send("proxy_logs", { message: `Sending the last batch number ${batchNumber} of users ${new Date().toISOString()}` })
      }
      $.send("sendUsersToSubgraph", batch)

      batchesSent++
      // Check if all batches have been sent
      if (batchesSent === totalBatches) isSending = false // Reset the sending flag after the last iteration
    })
  }
}

/**
 * Sets up a timer to trigger the drain event manually if not received within a specified timeout.
 */
let drainTimer
let manualTriggerCount = 0
const setupDrainTimer = () => {
  clearTimeout(drainTimer)

  drainTimer = setTimeout(() => {
    if (manualTriggerCount >= 10)
      $.send("proxy_logs", {
        message: `manualTriggerCount = ${manualTriggerCount}! Executes to offen. Something with drain event. It can be when subgraf not send "drain" event. Or subgraph do not have enough time for user processing`,
      })
    onDrain()
      .then(() => {
        manualTriggerCount++
        setupDrainTimer() // Reset the timer after successful drain
      })
      .catch(error => {
        $.send("errorMessage", { message: error })
        console.error("Drain failed:", error)
      })
  }, SEND_WITHOUT_DRAIN_TIMEOUT)
}

// Initiate the main functionality immediately upon script start
onDrain()
// Start the drain timer to send batches if fist drain event nor recieved
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
  $.send("errorMessage", data)
})

process.on("uncaughtException", error => {
  console.error(error)
  $.send("errorMessage", error)
})
