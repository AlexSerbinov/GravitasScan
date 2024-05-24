const { getArchiveData } = require("../../redis")

/**
 * @param {string} protocol - The protocol name V1, V2, V3, Compound, Liquity, MakerDAO_CDP
 * @param {Queue} queue - The queue instance to add the users to process
 * @param {object} params - The object that contains all params from $.params
 * @param {number} batchSize - params. from The number of users to proccess on simulator by one request. Can produse the error with values more than 35-50.
 * @param {boolean} useSimulatorInsteadOfNode - params. from The mode of the service. 'node' or 'simulator'
 */
const getArchiveUsersAndStartScanning = async (protocol, queue, params) => {
  try {
    // Fetch the archive data for both 'archive_users'
    const archiveUsersData = await getArchiveData(protocol, "archive_users")
    let allUsers
    if (archiveUsersData) allUsers = Object.values(archiveUsersData).flat()
    const users = allUsers.map(userInfo => userInfo.user)

    splitUsersIntoBatches(users, queue, params)
  } catch (error) {
    console.error(error)
    throw error
  }
}

/**
 * @param {Array} users - The array of users to split into batches
 * @param {Queue} queue - The queue instance to add the users to process
 * @param {object} params - The object that contains all params from $.params
 * @param {number} batchSize - params. from The number of users to proccess on simulator by one request. Can produse the error with values more than 35-50.
 * @param {boolean} useSimulatorInsteadOfNode - params. from The mode of the service. 'node' or 'simulator'
 */
const splitUsersIntoBatches = (users, queue, params) => {
  try {
    let batchSize
    if (params.useSimulatorInsteadOfNode) {
      batchSize = params?.batchSize || 30
    } else if (!params.useSimulatorInsteadOfNode) {
      batchSize = 1
    } else {
      throw new Error("useSimulatorInsteadOfNode param not set")
    }

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      if (params.useSimulatorInsteadOfNode || batchSize > 1) {
        queue.add(batch)
      } else {
        queue.add(batch[0])
      }
    }
  } catch (error) {
    console.error(error)
    throw error
  }
}

module.exports = {
  getArchiveUsersAndStartScanning,
}
