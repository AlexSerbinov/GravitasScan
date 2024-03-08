// Handler for sending users to subgraph in batches.
fetcher.on("sendUsersToSubgraph", async data => {
  const nonBlacklistedUsers = await getNonBlacklistedUsers(protocol)
  await sendUsersToSubraphInBatches(nonBlacklistedUsers)
})

$.on("drain", () => {
 console.log("recieved drain event");
 
  onDrain("event")
})

// Utility function to read and parse the user file.
const getUserFromFile = async () => {
  const filePath = path.join(__dirname, "allUsers", "allUsersM.json")
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
  const batchSize = 10
  for (let i = 0; i < nonBlacklistedUsers.length; i += batchSize) {
    const batch = nonBlacklistedUsers.slice(i, i + batchSize)
    console.log(`Sending batch of ${batch.length} users`)
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
    console.log(`Manually triggering drain after ${manualTriggerCount === 0 ? "10 seconds" : "20 seconds"} of inactivity.`)
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
