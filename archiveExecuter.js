require("./lib/helpers/config.helper")
const { startArchive } = require("./lib/services/archive")
// const connectionChecker = require("./lib/services/connections")
// const db = require("./lib/db")
// const { SERVICE_STATUS } = require("./lib/constants")
// const { sendErrorEvent, sendStartEvent } = require("./lib/services/archive/mq")

// const protocol = process.env.PROTOCOL

async function start() {
  // sendStartEvent({ message: `${protocol} archive starting at ${new Date().toLocaleString("en-US")}` })

  // const [dbActive, dbSynced, nodeActive] = await Promise.all([
  //   await connectionChecker.checkDBConnection(),
  //   await connectionChecker.syncDBArchive(),
  //   await connectionChecker.checkNodeConnection(),
  // ])

  // if (!dbActive || !nodeActive) {
  //   sendErrorEvent({ message: `${protocol} archive terminating` })
  //   setImmediate(() => {
  //     process.exit(1)
  //   })
  // }

  // startArchive(protocol)
}

start().catch(e => {
  sendErrorEvent({ message: `${protocol} archive error`, error: e })
  db.sequelize.close().then(() => process.exit(1))
})
