const fs = require("fs").promises
const path = require("path")
// const db = require("../../db")
const { checkUsersInBlacklistSet } = require("../../redis")

const getArchiveOrSubgraphUsers = async (protocol, queue) => {
  try {
    // Read the allUsers.json file
    const filePath = path.join(__dirname, "allUsers.json")
    const data = await fs.readFile(filePath, "utf8")
    const allUsers = JSON.parse(data)

    console.log(`1----=-----=----=----=----=----=----- allUsers[0] -----=-----=-----=-----=-- 1`)
    console.log(allUsers[0])
    console.log(`2----=-----=----=----=----=----=----- allUsers[0] -----=-----=-----=-----=-- 2`)

    // Extract user information from the JSON data
    const users = allUsers.map(userInfo => userInfo.user)
    // Check if users are in the blacklist

    const checkBlacklistUsers = await checkUsersInBlacklistSet(users, protocol)

    // Add non-blacklisted users to the queue
    for (let i = 0; i < allUsers.length; i++) {
      if (checkBlacklistUsers[i] === 0) {

        queue.add(allUsers[i].user)
      }
    }
  } catch (error) {
    console.error("Error reading allUsers.json:", error)
  }
}

module.exports = {
  getArchiveOrSubgraphUsers,
}
