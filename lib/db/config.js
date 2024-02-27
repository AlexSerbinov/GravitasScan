require("../helpers/config.helper")

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: {
      pool: {
        max: +process.env.DB_POOL_SIZE,
        min: 0,
        acquire: 600000,
        idle: 100000,
      },
    },
  },
}
