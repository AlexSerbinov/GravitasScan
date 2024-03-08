"use strict"
const { EventEmitter } = require("node:events")

/**
 * Simple Queue
 */
class Queue extends EventEmitter {
  /**
   * @param {Function} executer - item executer
   * @param {number} timeout - execution timeout in ms. Default: 100
   */
  constructor(executer, timeout) {
    super()
    this.executer = executer
    this.items = []
    this.running = false
    this.execTimeout = timeout || 100
    this.drainWaitTime = 450 // 
  }

  /**
   * Current length of queue
   * @returns {number}
   */
  get length() {
    return this.items.length
  }

  /**
   * Add ittem to queu
   * @param {*} item - will go to executer
   * @returns {Queue}
   */
  add(item) {
    this.items.push(item)
    if (!this.running) this._execute()
    return this
  }

  /**
   * Recursive unblocking execution
   */
  _execute() {
    this.running = true
    setImmediate(async () => {
      const item = this.items.shift()
      if (item === undefined) {
        // Ожидаем некоторое время перед эмитированием события drain
        setTimeout(() => {
          this.running = false
          this.emit("drain", null)
        }, this.drainWaitTime)
        return
      }

      let broke = false
      const timeout = setTimeout(() => {
        broke = true
        this._execute()
      }, this.execTimeout)

      try {
        await this.executer(item)
      } catch (e) {
        this.emit("error", e)
      }
      if (broke) return
      else clearTimeout(timeout)
      this._execute()
    })
  }
}

/**
 * Default Queue factory
 * @param {Function} executer - item executer
 * @param {number} {number} timeout - execution timeout in ms. Default: 100
 * @returns {Queue}
 */
const createQueue = (executer, timeout) => new Queue(executer, timeout)

module.exports = { Queue, createQueue }
