const db = require("../db")
const provider = require("../ethers")
const { pm2log } = require("../helpers/logger")

module.exports = {
  async checkDBArchive(protocol) {
    try {
      const data = await db.UserArchive.findOne({ where: { protocol } })
      // console.log(data)

      if (!data || (!Object.keys(data.archive_users).length && !Object.keys(data.listener_users).length)) {
        pm2log({ message: `Archive is empty!` })

        return false
      }

      pm2log({ message: `Archive is full!` })

      return true
    } catch (e) {
      pm2log({ message: `Archive is unreachable!`, e })

      return false
    }
  },

  async checkDBConnection() {
    try {
      await db.sequelize.authenticate()
      pm2log({ message: `DB is live!` })
      return true
    } catch (err) {
      pm2log({ message: `DB is unreachable!`, err })
      return false
    }
  },

  async syncDB() {
    try {
      await db.sequelize.sync({ alter: true })
      pm2log({ message: `DB sync success!` })
      return true
    } catch (err) {
      pm2log({ message: `DB model is desynchronized! Make sure that you're starting right service version!`, err })
      return false
    }
  },

  async syncDBArchive() {
    try {
      const UserArchive = db.sequelize.models.user_archive
      await UserArchive.sync({ alter: true })
      pm2log({ message: `DB sync success!` })
      return true
    } catch (err) {
      pm2log({ message: `DB archive model is desynchronized! Delete table -user_archive- or sync manually!`, err })
      return false
    }
  },

  async checkNodeConnection() {
    try {
      const lastBlock = await provider.getBlockNumber()
      console.log(`lastBlock: ${lastBlock}`)

      pm2log({ message: `Node is live!` })
      return true
    } catch (e) {
      pm2log({ message: `Node is unreachable!`, e })
      return false
    }
  },
}
