'use strict'
const { prepare, subscribe, unsubscribe,
  notify, end, countChannels, countListeners, isReady } = require('..')
const metatests = require('metatests')

/**
 * Mosquitto test hosting
 */
const HOST = 'mqtt://test.mosquitto.org'
console.log(`Testing for host: ${HOST}`)

prepare(HOST).then(() => {

  /**
   * Should be ready after prepare() resolve
   */
  metatests.test('Connection test', test => {
    test.strictEqual(isReady(), true)
    test.end()
  })
  
  /**
   * Subscribe/unsubscribe test
   */
  metatests.test('Subscribe/unsubscribe test', test => {
    subscribe('SOME_CHANNEL', () => {})
    subscribe('SOME_CHANNEL', () => {})
    subscribe('SOME_CHANNEL_1', () => {})
    test.strictEqual(countChannels(), 2)
    test.strictEqual(countListeners('SOME_CHANNEL'), 2)
    unsubscribe('SOME_CHANNEL')
    test.strictEqual(countChannels(), 1)
    unsubscribe('SOME_CHANNEL_1')
    test.strictEqual(countChannels(), 0)
    test.end()
  })

  /**
   * Messaging test
   */
  metatests.test('Messaging test', test => {
    const channel = 'TEST_CHANNEL'
    const message = 'Test message.'
    subscribe(channel, m => {
      test.strictEqual(message, m.message)
      test.end()
      finalizationTest()
    })
    notify(channel, { message })
  })

  /**
   * Finalization test
   * call after all test done
   */
  const finalizationTest = () => {
    metatests.test('Finalization test', async test => {
      await end()
      test.strictEqual(isReady(), false)
      test.throws(() => { subscribe('c', () => {})})
      test.throws(() => { notify('c', () => {})})
      test.end()
    })
  }  
}) 
