## Usage

``` js
const mq = require('../lib')

mq.prepare('mqtt://test.mosquitto.org').then(() => {

  mq.subscribe('my_channel', m => {
    console.dir(m)
    mq.unsubscribe('my_channel')
  })

  mq.notify('my_channel', { message: 'Hello!'})
})
```