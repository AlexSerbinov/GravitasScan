const { createConcurrency } = require("../lib")

const queue = createConcurrency(10, item => console.log(item), 100)
queue.add("Some item.")
