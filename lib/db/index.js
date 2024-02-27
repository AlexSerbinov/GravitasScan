const { Sequelize } = require("sequelize")

const sequelize = new Sequelize({
  dialect: "postgres",
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  logging: false,
  pool: {
    max: +process.env.DB_POOL_SIZE,
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
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME_TEST,
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
