const EventEmitter = require("node:events")
const redis = require("../lib/redis/redis/lib/redis")
const { getArchiveData } = require("../lib/redis/index")


/**
 * @param {number} batchSize - The number of users to process in each batch. This determines the size of the user groups
 * sent to the subgraph in each operation, affecting the throughput and efficiency of the data processing.
 * This is also the number of users that will be sent to the simulator in one bundle. NOTE: that with a bundle size
 * greater than 30-50 (depend on transaction size), the simulator may produce an error due to exceeding the block's gas limit.
 *
 * @param {string} protocol - The name of the lending protocol (e.g., "V1", "V2", "V3" "Compound")
 *
 * @param {string} configPath - Path to the configuration file that contains necessary settings and parameters for the service.
 * This file includes configurations such as database connections, service endpoints, and other operational parameters.
 *
 * @param {number} SEND_WITHOUT_DRAIN_TIMEOUT - The maximum amount of time (in milliseconds) to wait before forcibly sending a
 * batch of users if no 'drain' event is received. This timeout ensures that data continues to flow, preventing potential
 * deadlocks or stalls in data processing.
 * 
 * @param {string} service - The name of the service (e.g., "subgraph", "dataFetcher", "TransmitFetcher" "Proxy", "Archive", etc.)
 * 
 */
const { batchSize, protocol, configPath, service, SEND_WITHOUT_DRAIN_TIMEOUT } = $.params
const config = require(`${process.cwd()}${configPath}`)
const fetcher = new EventEmitter()


/**
* We prepare redis here because only in this place we have config params. And we don't want to use global variables.
*/
await redis.prepare(config.REDIS_HOST, config.REDIS_PORT) // Check if needed
const { checkUsersInBlacklistSet } = require("../lib/redis")

$.send("start", {
  service,
  protocol,
  ev: "start",
  data: `proxy started`,
})

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
    console.log(`drainEventCount = ${drainEventCount} of ${data.forks}`)
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
      $.send("info", {
        service,
        protocol,
        ev: "info",
        data: `${protocol} Received  drain event from subgraph. Flag isSending = ${isSending}`,
      })

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
  console.log(`${protocol} all users count: ${usersToCheck.length}`)
  const checkBlacklistUsers = await checkUsersInBlacklistSet(usersToCheck, protocol)

  const nonBlacklistedUsers = allUsers
    .filter((_, index) => checkBlacklistUsers[index] === 0)
    .map(userInfo => userInfo.user.toLowerCase())  // Mapping to get only user addresses and Convert users to lowercase after filtering
  console.log(`${protocol} non blacklisted users count: ${nonBlacklistedUsers.length}`)

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
  const totalBatches = Math.ceil(nonBlacklistedUsers.length / batchSize)
  let batchesSent = 0

  for (let i = 0; i < nonBlacklistedUsers.length; i += batchSize) {
    // Use setImmediate for asynchronous sending
    setImmediate(async () => {
      const batch = nonBlacklistedUsers.slice(i, i + batchSize)
      const batchNumber = i / batchSize + 1

      // Check if the current batch is the last one
      if (batchNumber === totalBatches) {
        $.send("info", {
          service,
          protocol,
          ev: "info",
          data: `Sending the last batch number ${batchNumber} of users ${new Date().toISOString()}`,
        })
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
      $.send("info", {
        service,
        protocol,
        ev: "info",
        data: `Bad behavior. manualTriggerCount = ${manualTriggerCount}! Executes to offen. Something with drain event. It can be when subgraf not send "drain" event. Or subgraph do not have enough time for user processing`,
      })

    onDrain()
      .then(() => {
        manualTriggerCount++
        setupDrainTimer() // Reset the timer after successful drain
      })
      .catch(error => {
        $.send("errorMessage", {
          service,
          protocol,
          ev: "errorMessage",
          data: error,
        })

        console.error("Drain failed:", error)
      })
  }, SEND_WITHOUT_DRAIN_TIMEOUT)
}


// Initiate the main functionality immediately upon script start
onDrain()
// Start the drain timer to send batches if fist drain event nor recieved
setupDrainTimer()

fetcher.on("error", data => {
  $.send("errorMessage", {
    service,
    protocol,
    ev: "errorMessage",
    data,
  })
})


/**
 * Handle process exit
 */
$.onExit(async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      const { pid } = process
      console.log(pid, "Ready to exit.")
      const date = new Date().toUTCString()
      $.send("stop", {
        service: "archive",
        protocol,
        ev: "stop",
        data: date,
      })
      resolve()
    }, 100) // Small timeout to ensure async cleanup completes
  })
})


// Handle uncaught exceptions
process.on("uncaughtException", error => {
  $.send("errorMessage", {
    service: "archive",
    protocol,
    ev: "errorMessage",
    data: error,
  })
})
