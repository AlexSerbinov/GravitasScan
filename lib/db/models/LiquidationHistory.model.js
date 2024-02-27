const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  return sequelize.define(
    "liquidation_history",
    {
      protocol: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      user: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      reserve_address: {
        type: DataTypes.TEXT,
        defaultValue: null,
      },
      reserve_amount: {
        type: DataTypes.DECIMAL,
        defaultValue: null,
      },
      collateral_address: {
        type: DataTypes.TEXT,
        defaultValue: null,
      },
      collateral_amount: {
        type: DataTypes.DECIMAL,
        defaultValue: null,
      },
      tx_id: {
        type: DataTypes.TEXT,
        defaultValue: null,
      },
      liquidator: {
        type: DataTypes.TEXT,
        defaultValue: null,
      },
      granted_bonus: {
        type: DataTypes.TEXT,
        defaultValue: null,
      },
      realized_profit: {
        type: DataTypes.DECIMAL,
        defaultValue: null,
      },
      block_number: {
        type: DataTypes.INTEGER,
        defaultValue: null,
      },
      liquidatedAt: {
        type: DataTypes.DATE,
        defaultValue: null,
      },
      transmits: {
        type: DataTypes.JSON,
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
      updatedAt: false,
    }
  )
}
