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
  console.log("PROXY: received drain event from subgraph")
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
  const nonBlacklistedUsers = allUsers.filter((_, index) => checkBlacklistUsers[index] === 0)
  console.log(`PROXY: All users number =     ${usersToCheck.length}`)
  console.log(`PROXY: Non blacklist number = ${nonBlacklistedUsers.length}`)

  return nonBlacklistedUsers
}

// Send users in batches.
const sendUsersToSubraphInBatches = async nonBlacklistedUsers => {
  const batchSize = 20
  const totalBatches = Math.ceil(nonBlacklistedUsers.length / batchSize) // Определяем общее количество пакетов

  for (let i = 0; i < nonBlacklistedUsers.length; i += batchSize) {
    const batch = nonBlacklistedUsers.slice(i, i + batchSize)
    const batchNumber = i / batchSize + 1 // Номер текущего пакета (начинаем с 1)

    // console.log(`PROXY: Sending batch number ${batchNumber} of ${batch.length} users`)

    // Проверяем, является ли текущий пакет последним
    if (batchNumber === totalBatches) {
      console.log(`\nPROXY: Sending the last batch ${batchNumber} of users`)
    }

    $.send("sendUsersToSubgraph", batch)
  }
}

const DRAIN_TIMEOUT_REPEAT = 10 * 60 * 1000 // 10 min for subsequent times

let drainTimer
let manualTriggerCount = 0

const setupDrainTimer = () => {
  clearTimeout(drainTimer) // It's safe to call clearTimeout even if drainTimer is undefined

  drainTimer = setTimeout(() => {
    console.log("Manually triggering drain after 10 min of inactivity.")
    onDrain()
      .then(() => {
        manualTriggerCount++
        setupDrainTimer() // Reset the timer after successful drain
      })
      .catch(error => console.error("Drain failed:", error))
  }, DRAIN_TIMEOUT_REPEAT)
}

const onDrain = async () => {
  const nonBlacklistedUsers = await getNonBlacklistedUsers(protocol) // Ensure protocol is correctly defined or passed
  await sendUsersToSubraphInBatches(nonBlacklistedUsers)
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
