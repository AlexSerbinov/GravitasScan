const mqtt = require("mqtt")

// Create MQTT client
const client = mqtt.connect("mqtt://10.10.13.23") // Example MQTT broker address
let receivedMessages = 0

// Connecting to MQTT broker
client.on("connect", () => {
  console.log("Connected to MQTT broker")

  // Subscribe to the topic user:subraph:Compound
  client.subscribe("user:subraph:Compound", (err) => {
    if (err) {
      console.error("Error subscribing to topic:", err)
    }
  })
})

// Receiving messages from the topic
client.on("message", (topic, message) => {
//   if (topic === "testMqttUsers") {
    receivedMessages++
    console.log(`Received message ${receivedMessages}:`)
//   }
})

// Error handling
client.on("error", (err) => {
  console.error("MQTT error:", err)
})
