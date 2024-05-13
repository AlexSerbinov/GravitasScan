const { getArchiveData } = require("../../redis")

const getArchiveOrSubgraphUsers = async (protocol, queue) => {
  try {
    // Fetch the archive data for both 'archive_users'
    const archiveUsersData = await getArchiveData(protocol, "archive_users")
    let allUsers
    if (archiveUsersData) allUsers = Object.values(archiveUsersData).flat()
    const users = allUsers.map(userInfo => userInfo.user)
    users.forEach(user => {
      queue.add(user)
    })
  } catch (error) {
    console.error(error)
  }
}

module.exports = {
  getArchiveOrSubgraphUsers,
}
