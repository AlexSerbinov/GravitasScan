const { createQueue } = require("../lib")

console.log("start")
const queue = createQueue(item => {
  console.log(item)
  return new Promise(resolve => {
    setTimeout(() => resolve(), 1000)
  })
}, 1000)

for (let i = 0; i < 1000; i++) {
  queue.add(i)
}


// setInterval(() => console.log('int'), 100)
