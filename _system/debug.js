"use strict"
Error.stackTraceLimit = 100 // When debug is on - show 100 lines of error stack trace instead of default 10
const { getConfig } = require("./config")

/**
 * System config
 */
const sysConf = getConfig()

/**
 * Services name to debug
 */
const name = process.argv[3]

/*
 * Services config json path
 */
const confP = process.argv[2]
const conf = require(`${process.cwd()}/${confP}`)

/**
 * Start service as node fork
 * @param {string} name - service name
 * @param {string} params - service params
 * @returns child process
 */
const node = (name, params) => {
  const debug = true

  process.argv[2] = name
  process.argv[3] = JSON.stringify(params)
  process.argv[4] = debug
  require(`${__dirname}/cluster.js`)
}

/**
 * Outputs
 */
console.log(`*** DEBUGING SERVICE ${name} WITH CONFIG: *** \n`)
console.log(`-- system:`)
console.dir(sysConf)
console.log(`-- service:`)
console.dir(conf[name])
console.log("\n************************************\n")
console.log(`\n*** WATCH SYSTEM STATE THROUGH MQTT ***\n`)
console.log(`mqtt sub -h '${sysConf.mq.host.split("//")[1]}' -t '${sysConf.mq.topics.stats}'`)
console.log("\n************************************\n")

/**
 * Start service
 */
node(name, conf[name])

/**
 * SIGINT
 */
process.on("SIGINT", () => process.exit(0))
