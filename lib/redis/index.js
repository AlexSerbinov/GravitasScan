const redis = require("./redis/lib")

/**
 * Single Redis client getter
 * @returns {Promise<object>} - A promise that resolves to the Redis client instance.
 */
const getRedisClient = async () => {
  if (redis.isReady()) {
    return redis
  }
  await redis.prepare(process.env.REDIS_HOST, process.env.REDIS_PORT)
  // await redis.prepare("10.10.13.23", "6379")
  return redis
}

/**
 * Adds a user to the blacklist
 * @param {string} user - user address
 * @param {string} protocol - V1, V2, V3...
 * @returns {Promise<boolean>} - A promise that resolves to true if the user was added
 */
const addUserToBlacklist = async (user, protocol) => {
  const redisClient = await getRedisClient()
  const userRedis = await redisClient.set(`blacklist:${protocol}:${user}`, {})
  return userRedis === "OK"
}

/**
 * Remove user from the blacklist
 * @param {string} user - user address
 * @param {string} protocol - V1, V2, V3...
 * @returns {Promise<boolean>} - A promise that resolves to true if the user was deleted
 */
const removeUserFromBlacklist = async (user, protocol) => {
  const redisClient = await getRedisClient()
  const userRedis = redisClient.del(`blacklist:${protocol}:${user}`)
  return userRedis === 1
}

/**
 * Check user exist in the blacklist
 * @param {string} user - user address
 * @param {string} protocol - V1, V2, V3...
 * @returns {Promise<boolean>} - A promise that resolves to true if the user exists in the blacklist
 */
const checkUserInBlacklist = async (user, protocol) => {
  const redisClient = await getRedisClient()
  const userRedis = await redisClient.get(`blacklist:${protocol}:${user}`)

  return userRedis !== null
}

/**
 * Methods with using redis SET
 */

/**
 * Add a users to the blacklist
 * @param {Array<string>} users - user addresses
 * @param {string} protocol - V1, V2, V3...
 * @returns {Promise<number>} - A promise that resolves to the number of elements that were added to the set, not including all the elements already present in the set.
 */
const addUsersToBlacklistSet = async (users, protocol) => {
  const redisClient = await getRedisClient()
  const result = await redisClient.sadd(`liq-registry:blacklist:${protocol}`, users)
  return result
}

/**
 * Remove users from the blacklist
 * @param {string} users - user addresses
 * @param {string} protocol - V1, V2, V3...
 * @returns {Promise<number>} - A promise that resolves to the number of members that were removed from the set, not including non existing members.
 */
const removeUsersFromBlacklistSet = async (users, protocol) => {
  const redisClient = await getRedisClient()
  const result = redisClient.srem(`liq-registry:blacklist:${protocol}`, users)
  return result
}

/**
 * Check users exists in the blacklist
 * @param {string} users - user addresses
 * @param {string} protocol - V1, V2, V3...
 * @returns {Promise<Array<number>>} - A promise that resolves to list representing the membership of the given elements, in the same order as they are requested.
 */
const checkUsersInBlacklistSet = async (users, protocol) => {
  const redisClient = await getRedisClient()
  const result = await redisClient.smismember(`liq-registry:blacklist:${protocol}`, users)

  return result
}

/**
 * Methods for working with DataFetcher and TransmitFetcher services
 */

/**
 * Add a users to the asset + protocol fot transmit fetcher service
 * @param {Array<string>} users - user addresses
 * @param {string} protocol - V1, V2, V3...
 * @param {string} asset - asset address
 * @returns {Promise<number>} - A promise that resolves to the number of elements that were added to the set, not including all the elements already present in the set.
 */
const addUsersToDataFetcherSet = async (users, protocol, asset) => {
  const redisClient = await getRedisClient()
  const result = await redisClient.sadd(`liq-registry:data-fetcher:${protocol}:${asset}`, users)
  return result
}

/**
 * Remove users from the asset + protocol for transmit fetcher service
 * @param {string} users - user addresses
 * @param {string} protocol - V1, V2, V3...
 * @param {string} asset - asset address
 * @returns {Promise<number>} - A promise that resolves to the number of members that were removed from the set, not including non existing members.
 */
const removeUsersFromDataFetcherSet = async (users, protocol, asset) => {
  const redisClient = await getRedisClient()
  const result = redisClient.srem(`liq-registry:data-fetcher:${protocol}:${asset}`, users)
  return result
}

/**
 * Get users from the asset + protocol for transmit fetcher service
 * @param {string} protocol - V1, V2, V3...
 * @param {string} asset - asset address
 * @returns {Promise<number>} - A promise that resolves to the number of members that were removed from the set, not including non existing members.
 */
const getUsersFromDataFetcherSet = async (protocol, asset) => {
  const redisClient = await getRedisClient()
  const result = redisClient.smembers(`liq-registry:data-fetcher:${protocol}:${asset}`)
  return result
}

module.exports = getRedisClient

module.exports = {
  getRedisClient,
  addUserToBlacklist,
  removeUserFromBlacklist,
  checkUserInBlacklist,
  addUsersToBlacklistSet,
  removeUsersFromBlacklistSet,
  checkUsersInBlacklistSet,
  addUsersToDataFetcherSet,
  removeUsersFromDataFetcherSet,
  getUsersFromDataFetcherSet,
}
