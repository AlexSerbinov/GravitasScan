const mqtt = require("mqtt")
const client = mqtt.connect("mqtt://10.10.13.23")

const topics = [
  // "event:success:transmit_fetcher:Compound",
  // "event:delete:transmit_fetcher:Compound",
  // "event:reject:transmit_fetcher:Compound",
  "event:error:data_fetcher:V1",
  "event:start:data_fetcher:V1",
  // "event:stop:transmit_fetcher:Compound",
  // "event:liquidate:transmit_fetcher:Compound",
  // "event:info:transmit_fetcher:Compound",
  // "execute:searcher:V2" 
]

client.on("connect", function () {
  topics.forEach(topic => {
    client.subscribe(topic, function (err) {
      if (!err) {
        console.log(`Successfully subscribed to topic ${topic}`)
      }
    })
  })
})

client.on("message", function (topic, message) {
  // the message can be a buffer, so first convert it to a string
  const messageStr = message.toString()

  try {
    // Convert the string to a JSON object
    const jsonObj = JSON.parse(messageStr)
    console.log(topic, jsonObj)
  } catch (e) {
    // In case of parsing error, print the original message
    console.error("Error converting message to JSON:", messageStr)
  }
})
