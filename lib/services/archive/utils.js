const db = require("../../db")

const saveUsersToArchive = async (protocol, blockNumber, users, column) => {
  const uniqueUsers = new Set(users)

  if (uniqueUsers.size) {
    const archive = await db.UserArchive.findOne({
      where: { protocol },
    })
    const { archive_users, listener_users } = archive

    const dbUsers = [Object.values(archive_users), Object.values(listener_users)].flat(Infinity)

    dbUsers
      .map(user => user.user)
      .forEach(user => {
        if (uniqueUsers.has(user)) {
          uniqueUsers.delete(user)
        }
      })

    if (uniqueUsers.size) {
      const newUsers = {
        ...archive[column],
        [blockNumber]: [...uniqueUsers].map(user => ({
          user,
          reserves: {},
        })),
      }

      await db.UserArchive.update({ [column]: newUsers, last_archive_modify: new Date() }, { where: { protocol } })
    }
  }

  return uniqueUsers.size
}

/**
 * Find latest handled block from db
 * @param {string} protocol
 */
const getLatestDbBlock = async protocol => {
  const archive = await db.UserArchive.findOne({ where: { protocol } })

  let latestArchiveBlock = 0
  if (archive) {
    const blocks = Object.keys(archive.archive_users)
    if (blocks.length) {
      latestArchiveBlock = Math.max(...blocks.map(Number))
    }
  } else {
    await db.UserArchive.create({ protocol, archive_users: {}, listener_users: {} })
  }

  return latestArchiveBlock
}

module.exports = {
  saveUsersToArchive,
  getLatestDbBlock,
}
