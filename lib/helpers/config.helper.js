const fs = require("fs")
const path = require("path")
const yargs = require("yargs")
const { hideBin } = require("yargs/helpers")
const defaultSettings = require("../../configs/DefaultSettings.json")
const { SERVICE_STATUS } = require("../constants")

// Using yargs to parse CLI arguments, with the hideBin helper for better parsing
const { argv } = yargs(hideBin(process.argv))

// Default configuration directory
let configDirectory = "configs/Main.json"

// Check for a custom configuration path passed as a CLI argument
if (argv.config) {
    configDirectory = argv.config
}

// Function to load configuration from a file and merge it into process.env
const loadConfig = () => {
    // Read the config file synchronously, resolve path from current working directory
    const json = fs.readFileSync(path.resolve(process.cwd(), configDirectory), "utf8")
    const config = JSON.parse(json) // Parse JSON content
    Object.assign(process.env, config) // Merge config into environment variables
}

// Execute loadConfig to apply configuration settings
loadConfig()

// Asynchronous function to synchronize settings based on protocol and service
const syncSettings = async (protocol, service) => {
    // Find default settings for the given protocol and service
    const defaults = defaultSettings.find(s => s.protocol === protocol).services[service]

    // Return the found settings
    return defaults
}

// Export the syncSettings function for external use
module.exports = { syncSettings }