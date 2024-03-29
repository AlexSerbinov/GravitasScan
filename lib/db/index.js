const { Sequelize } = require("sequelize")

const DB_NAME = "liquidation_db_1"
const DB_NAME_TEST = "liquidation_db_2"
const DB_HOST = "10.10.13.23"
const DB_PORT = 5432
const DB_USERNAME = "liquidation_registry"
const DB_PASSWORD = "OjwQl7zYhQVA4rBsrW4rzZ81v6s"
const DB_POOL_SIZE = 2

const sequelize = new Sequelize({
  dialect: "postgres",
  username: DB_USERNAME,
  password: DB_PASSWORD,
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  logging: false,
  pool: {
    max: +DB_POOL_SIZE,
    min: 0,
    acquire: 600000,
    idle: 100000,
  },
})

const db = {}
db.sequelize = sequelize
db.unlisten = () => {
  return sequelize.query(`UNLISTEN *`)
}
db.setServiceStatus = (service, protocols, statuses) => {
  return Promise.all(
    protocols.map((protocol, index) => {
      return db.LiqInstances.update(
        {
          protocol,
          name: service,
          status: statuses[index],
        },
        { where: { protocol, name: service } }
      )
    })
  )
}

if (process.env.ENV === "test") {
  const sequelizeTest = new Sequelize({
    dialect: "postgres",
    username: DB_USERNAME,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME_TEST,
    logging: false,
  })
  db.sequelizeTest = sequelizeTest
  db.LiquidationRegistry = require("./models/LiquidationRegistry.model")(sequelizeTest)
} else {
  db.LiquidationRegistry = require("./models/LiquidationRegistry.model")(sequelize)
}

db.LiquidationHistory = require("./models/LiquidationHistory.model")(sequelize)
db.LiqInstances = require("./models/LiqInstances.model")(sequelize)
db.LiqTests = require("./models/LiqTests.model")(sequelize)
db.UserArchive = require("./models/UserArchive.model")(sequelize)

module.exports = db
