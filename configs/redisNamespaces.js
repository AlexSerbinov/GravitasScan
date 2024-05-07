/**
 * We have extracted the Redis namespaces into a separate configuration file (redisNamespaces.js)
 * because these namespaces differ between the production and development environments.
 *
 * By centralizing the namespace definitions in a single file, we can easily manage and maintain the Redis 
 * key structure for different environments without modifying the code of namespaces in deep code structure.
 */
// For prod remove -dev
const REDIS_NAMESPACES = {
  globalNamespace: "dev-liq-registry",
  blacklist: {
    namespace: "dev-blacklist",
  },
  dataFetcher: {
    namespace: "dev-data-fetcher",
  },
  archive: {
    namespace: "dev-archive",
    lastModify: "dev-last_modify",
  },
}

module.exports = REDIS_NAMESPACES
