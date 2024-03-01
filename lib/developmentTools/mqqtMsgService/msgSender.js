const mqtt = require("mqtt")
const readline = require("readline")
const fs = require("fs")
const path = require("path")

const configPath = path.join(__dirname, "messagesConfig.json")
const messagesConfig = JSON.parse(fs.readFileSync(configPath, "utf8"))

const client = mqtt.connect("mqtt://10.10.13.23")

client.on("connect", () => {
  console.log("Connected to MQTT broker. Press a configured key to send a message.")

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.on("line", input => {
    const trimmedInput = input.trim()
    const messageConfig = messagesConfig[trimmedInput]

    if (messageConfig) {
      const { chanel, ...dataToSend } = messageConfig

      if (chanel) {
        const message = JSON.stringify(dataToSend)

        client.publish(chanel, message, {}, error => {
          if (error) {
            console.error("Publish error:", error)
          } else {
            console.log(JSON.parse(message))
            console.log(`Message published on channel ${chanel}`)
          }
        })
      } else {
        console.log("Channel not configured for key:", trimmedInput)
      }
    } else {
      console.log("No message configured for key:", trimmedInput)
    }
  })
})

client.on("error", error => {
  console.error("Connection error:", error)
})
