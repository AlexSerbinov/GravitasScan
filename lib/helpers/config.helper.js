const fs = require("fs")
const path = require("path")
const yargs = require("yargs")
const { hideBin } = require("yargs/helpers")
const defaultSettings = require("../configs/DefaultSettings.json")
const { SERVICE_STATUS } = require("../constants")

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

const syncSettings = async (protocol, service) => {
    const defaults = defaultSettings.find(s => s.protocol === protocol).services[service]

    return defaults
}

module.exports = { syncSettings }
