'use strict'
const { createQueue, Queue, createConcurrency } = require('../lib')
const metatests = require('metatests')

metatests.test('Creation test', test => {
  const queue = createQueue(() => {}, 100)
  test.strictEqual(queue instanceof Queue, true)
  test.end()
})

metatests.test('Consistency test', test => {
  const item = 'Some item.'
  createQueue(i => {
    test.strictEqual(i, item)
    test.end()
  })
  .add(item)
})

metatests.test('Safe timeout test', test => {
  const key = 'Key item.'
  const delay = 1000
  const start = Date.now()
  const queue = createQueue(item => {
    if (item === key) {
      test.strictEqual(Date.now() - start < delay, true)
      test.end()
    }
    return new Promise(resolve => {
      setTimeout(resolve, 1000)
    })
  }, 100)
  queue.add('some item...')
  queue.add(key)
})

metatests.test('After drain test', test => {
  const key = 'Key item.'
  const queue = createQueue(item => {
    if (item === key) test.end()
  }, 100)

  let count = 0
  let add = true
  queue.add('Some item.')
  queue.on('drain', () => { 
    if (!add) return
    count++
    if (count === 3) {
      queue.add(key)
      add = false
    }
    else queue.add('Some item.')
  })
})

metatests.test('Stress test', test => {
  const queue = createQueue(() => {
    return new Promise(resolve => {
      setTimeout(resolve, 1000)
    })
  }, 100)

  const int = setInterval(() => {
    queue.add('Some item.')
  }, 1)

  setTimeout(() => {
    clearInterval(int)
    test.end()
    process.exit(0)
  }, 3000)
})

metatests.test('Concurrency test', test => {
  const item = 'Some item.'
  const key = 'Key item.'
  createConcurrency(3, i => {
    if (i === key) test.end()
    else test.strictEqual(i, item)
  })
  .add(item)
  .add(item)
  .add(item)
  .add(item)
  .add(item)
  .add(item)
  .add(item)
  .add(item)
  .add(item)
  .add(key)
})
