const fs = require("fs")
const path = require("path")
const yargs = require("yargs")
const { hideBin } = require("yargs/helpers")
const defaultSettings = require("../configs/DefaultSettings.json")
const { SERVICE_STATUS } = require("../constants")
const { pm2log } = require("./logger")

const { argv } = yargs(hideBin(process.argv))

let configDirectory = "lib/configs/Main.json"

if (argv.config) {
  configDirectory = argv.config
}

function loadConfig() {
  const json = fs.readFileSync(path.resolve(process.cwd(), configDirectory))
  const config = JSON.parse(json)
  Object.assign(process.env, config)
}

loadConfig()
// TODO Remove
const db = require("../db")

const dbSettings = {}
let isSynced = false

const syncSettings = async (protocol, service) => {
  if (!isSynced) {
    await db.LiqInstances.sync()
    isSynced = true
  }

  const defaults = defaultSettings.find(s => s.protocol === protocol).services[service]

  const instance = await db.LiqInstances.findOne({ where: { protocol, name: service } })
  let newSettings = instance?.settings

  if (!newSettings) {
    pm2log({ message: `New protocol in settings - ${protocol}, ${service}` })

    await db.LiqInstances.create({
      protocol,
      name: service,
      settings: defaults,
      status: SERVICE_STATUS.OFF,
    })

    dbSettings[protocol] = dbSettings[protocol] || {}
    dbSettings[protocol][service] = { ...defaults }
    newSettings = { ...defaults }
  }

  if (JSON.stringify(Object.keys(defaults)) !== JSON.stringify(Object.keys(newSettings))) {
    await db.LiqInstances.update(
      {
        debug_data: { status: "Settings is outdated" },
      },
      { where: { protocol, name: service } }
    )
  } else if (instance?.debug_data?.status) {
    await db.LiqInstances.update(
      {
        debug_data: null,
      },
      { where: { protocol, name: service } }
    )
  }

  if (dbSettings[protocol] && dbSettings[protocol][service]) {
    Object.entries(dbSettings[protocol][service]).map(([key, value]) => {
      if (value !== newSettings[key]) {
        console.log(`${protocol} ${service} ${key}: ${value} -> ${newSettings[key]}`)
      }
    })
  }

  dbSettings[protocol] = dbSettings[protocol] || {}
  dbSettings[protocol][service] = newSettings

  return dbSettings[protocol][service]
}

module.exports = { syncSettings }
