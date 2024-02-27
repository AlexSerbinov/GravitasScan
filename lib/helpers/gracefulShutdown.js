const db = require("../db")

const gracefulShutdown = (callback = async () => null) => {
  ;["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) => {
    process.on(signal, async () => {
      try {
        await callback()
        await db.unlisten()
        await db.sequelize.close()

        console.log("✅ Service gracefulls shutted down!")

        process.exit(0)
      } catch (er) {
        console.log(er)
        process.exit(1)
      }
    })
  })
}

module.exports = { gracefulShutdown }
