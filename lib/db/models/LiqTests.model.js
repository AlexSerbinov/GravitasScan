const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  return sequelize.define(
    "liq_tests",
    {
      history_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      protocol: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      result: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      subgraph_result: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      searcher_result: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      path_factory_result: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      liquidator_result: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      freezeTableName: true,
      updatedAt: false,
    }
  )
}
