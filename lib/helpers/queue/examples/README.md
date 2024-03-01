## Examples

queue

```js
const { createQueue } = require("../lib")

const queue = createQueue(item => console.log(item), 100)
queue.add("Some item.")
```

concurrency

```js
const { createConcurrency } = require("../lib")

const queue = createConcurrency(10, item => console.log(item), 100)
queue.add("Some item.")
```
