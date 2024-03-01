"use strict"
const { exec } = require("node:child_process")
const { getConfig } = require("./config")

/**
 * Sleep between starting pm2 exec
 * @param {*} ms
 * @returns
 */
const sleep = ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

/**
 * Run service
 * @param {string} name - service name
 * @param {string} params - service params
 * @param {string} mode - can be: 'debug'
 * @returns
 */
const runService = async (name, namespace, params) => {
  console.log(`Starting: ${name} | ${namespace}`)
  const process = exec(`pm2 --name ${name} --namespace ${namespace} --time start ` + `${__dirname}/cluster.js -- '${name}' '${params}'`)
  await sleep(700)
  return process
}

/**
 * System entry point
 * @param {string} confP - path to config file
 */
const start = async confP => {
  const config = getConfig()
  if (!config) throw new Error("No config.")
  console.log("*** STARTING CLUSTER WITH CONFIG *** \n")
  console.dir(config)
  console.log("\n************************************\n")
  const cwd = process.cwd()
  const conf = require(`${cwd}/${confP}`)
  const confs = []

  for (const name in conf) {
    const p = conf[name]
    Object.assign(p, { name })
    confs.push(p)
  }

  for await (const p of confs) {
    const { namespace, name } = p
    const params = JSON.stringify(p)
    await runService(name, namespace, params)
  }

  console.log(`\n*** WATCH SYSTEM STATE THROUGH MQTT ***\n`)
  console.log(`mqtt sub -h '${config.mq.host.split("//")[1]}' -t '${config.mq.topics.stats}'`)
  console.log("\n************************************\n")
}

/**
 * Services config json path
 */
const conf = process.argv[2]

/**
 * Entry point
 */
start(conf)

/**
 * SIGINT
 */
process.on("SIGINT", () => process.exit(0))
