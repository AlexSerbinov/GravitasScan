## API
```js

/**
 * Prepare client first,
 * do any call after .prepare() will resolve
 */
mq.prepare(MQTT_HOST)

/**
 * Subscribe for channel
 */
mq.subscribe(CHANNEL_NAME, callback)

/**
 * Unsubscribe
 * All listeners binded to this channel name will be removed
 */
mq.unsubscribe(CHANNEL_NAME)

/**
 * Publish object to the channel,
 * yes a messages should be an object
 */
mq.notify(CHANNEL_NAME, { m: 'hello...'})

/**
 * Count active channels,
 * we are subscribed for
 */
mq.countChannel()

/**
 * Count active listeners
 * for given CHANNEL_NAME
 */
mq.countListeners(CHANNEL_NAME)

/**
 * Is client reade
 * will be true only after callin .prepare()
 */
mq.isReady()

/**
 * Close mqtt connection,
 * and remove all listeners
 */
mq.end()

```