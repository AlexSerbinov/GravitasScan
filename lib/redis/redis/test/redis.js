"use strict"
const metatests = require("metatests")
const { prepare, set, get, del, isReady, end, sadd, smismember, srem, smembers, scard } = require("../lib")

/**
 * Redis test hosting
 */
const HOST = "localhost"
const PORT = 6379
console.log(`Testing for host:${HOST}:${PORT}`)

prepare(HOST, PORT)
  .then(() => {
    /**
     * Should be ready after prepare() resolve
     */
    metatests.test("Connection test", (test) => {
      // Assuming you have an 'isReady' function in your Redis module
      test.strictEqual(isReady(), true)
      test.end()
    })

    /**
     * set/get/del test
     */
    metatests.test("set/get/del test", async (test) => {
      const key = "TEST_KEY"
      const value = "Test value"

      // Test set operation
      const setValue = await set(key, value)
      test.strictEqual(setValue, "OK")

      // Test get operation
      const getValue = await get(key)
      test.strictEqual(getValue, value)

      // Test del operation
      const delValue = await del(key)
      test.strictEqual(delValue, 1)

      // Test get after del operation
      const getAfterDel = await get(key)
      test.strictEqual(getAfterDel, null)

      test.end()
    })

    /**
     * sadd/smismember/srem test
     */
    metatests.test("sadd/smismember/srem test", async (test) => {
      const key = "TEST_KEY_SET"
      const value1 = "test_value1"
      const value2 = "test_value2"

      // Test sadd operation
      const setValue = await sadd(key, [value1, value2])
      test.strictEqual(setValue, 2)

      // Test count operation
      const countValue = await scard(key)
      test.strictEqual(countValue, 2)

      // Test get all members operation
      const getAllMembers = await smembers(key)
      test.strictEqual(getAllMembers, [value1, value2])

      // Test smismember operation
      const smismemberValue = await smismember(key, [value1, "test_value3"])
      test.strictEqual(smismemberValue, [1, 0])

      // Test remove from set
      const getAfterDel = await srem(key, [value1])
      test.strictEqual(getAfterDel, 1)

      // Test members after deletion
      const getValue = await smembers(key)
      test.strictEqual(getValue, [value2])

      // Test del set
      const delSet = await del(key)
      test.strictEqual(delSet, 1)

      await end()

      test.end()
    })
  })
  
  .catch((err) => {
    console.error(`Failed to prepare Redis: ${err}`)
  })
