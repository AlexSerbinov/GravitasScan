## Prepare

Only for testsing required.
```sh
npm i
```
## Testing

```sh
npm run test
```

## Usage
See ./examples folder

queue
```js
const { createQueue } = require('../lib')

const queue = createQueue(item => console.log(item), 100)
queue.add('Some item.')
```

concurrency
```js
const { createConcurrency } = require('../lib')

const queue = createConcurrency(10, item => console.log(item), 100)
queue.add('Some item.')
```
