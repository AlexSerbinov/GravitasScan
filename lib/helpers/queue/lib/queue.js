"use strict"
const { EventEmitter } = require("node:events")

/**
 * Simple Queue
 */
class Queue extends EventEmitter {
  /**
   * @param {Function} executer - item executer
   * @param {number} execTimeout - /**
   * @param {number} execTimeout - Default 100. This is the time limit for each task's execution within the queue. If a task exceeds this duration, the queue will attempt to move on to the next task, preventing the system from being stalled by tasks that take too long to complete. Default value: 100 ms. Adjusting this value can help manage the balance between responsiveness and allowing adequate time for task completion.
   */
  constructor(executer, execTimeout) {
    super()
    this.executer = executer
    this.items = []
    this.running = false
    this.execTimeout = execTimeout || 100
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
      // TODO remove this after long test
      if (this.items.length % 10 === 1 && this.items.length !== 0) {
        console.log(`items in queue ${this.items.length} ${new Date().toISOString()}`) //dev
      }

      const item = this.items.shift()
      if (item === undefined) {
        this.running = false
        this.emit("drain", null)
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
 * @param {number} {execTimeout} timeout - execution timeout in ms. Default: 100
 * @returns {Queue}
 */
const createQueue = (executer, execTimeout) => new Queue(executer, execTimeout)

module.exports = { Queue, createQueue }
