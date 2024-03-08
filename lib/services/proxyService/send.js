const fs = require("fs")
const mqtt = require("mqtt")
const path = require("path")

// const client = mqtt.connect("mqtt://localhost") // Example MQTT broker address
const client = mqtt.connect("mqtt://10.10.13.23") // Example MQTT broker address

client.on("connect", () => {
  console.log("Connected to MQTT broker")
  const filePath = path.resolve(__dirname, "Compound_2024-03-05T15-33-16.json") // File path
  const data = fs.readFileSync(filePath) // Synchronously read data from file
  const messages = JSON.parse(data) // Parsing data in JSON format

  // Iterating through all messages
  messages.forEach((message, index) => {
    setTimeout(() => {
      setImmediate(() => {
        client.publish("user:subraph:Compound", JSON.stringify(message), (err) => {
          if (err) {
            console.error(`Error publishing message ${index + 1}:`, err)
          } else {
            console.log(`Message ${index + 1} published`)
          }

          // Check if this is the last message to send
          if (index === messages.length - 1) {
            console.log(`user:subraph:Compound: ${messages.length}`)
            client.end() // Close connection to MQTT broker after sending all messages
          }
        })
      })
    }, (index + 1) * 1000); // Multiply the index by 1000 milliseconds (1 second)
  })
})

client.on("error", (err) => {
  console.error("MQTT error:", err)
})

// TODO Зробити з цього окремий сервіс. Додати лістенер drain. 