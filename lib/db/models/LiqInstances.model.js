const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  return sequelize.define(
    "liq_instances",
    {
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      protocol: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      settings: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      debug_data: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
      updatedAt: false,
    }
  )
}
