const fs = require("fs").promises
const path = require("path")
// const db = require("../../db")
const { checkUsersInBlacklistSet } = require("../../redis")

const getArchiveOrSubgraphUsers = async (protocol, queue) => {
  try {
    // Read the allUsers.json file

    const filePath = path.join(__dirname, "allUsers.json")
    // console.log(`======================= ${filePath} ===================`)

    const data = await fs.readFile(filePath, "utf8")
    const allUsers = JSON.parse(data)

    const startTime = Date.now()
    // console.log(`======================= time before allUsers.map ${startTime} ===================`)

    // Extract user information from the JSON data
    const users = allUsers.map(userInfo => userInfo.user)
    // Check if users are in the blacklist

    const checkBlacklistUsers = await checkUsersInBlacklistSet(users, protocol)
    const endTime = Date.now()
    const executionTime = endTime - startTime
    // console.log(`1----=-----=----=----=----=----=----- execution time -----=-----=-----=-----=-- 1`)
    // console.log(executionTime)
    // console.log(`2----=-----=----=----=----=----=----- execution time -----=-----=-----=-----=-- 2`)

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
