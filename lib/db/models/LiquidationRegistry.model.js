const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  return sequelize.define(
    "liquidation_registry",
    {
      protocol: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      user: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      health_factor: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      reserve_addresses: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: null,
      },
      reserve_amounts: {
        type: DataTypes.ARRAY(DataTypes.DECIMAL),
        defaultValue: null,
      },
      collateral_addresses: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: null,
      },
      collateral_amounts: {
        type: DataTypes.ARRAY(DataTypes.DECIMAL),
        defaultValue: null,
      },
      block_number: {
        type: DataTypes.INTEGER,
        defaultValue: null,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["protocol", "user"],
        },
      ],
      freezeTableName: true,
      timestamps: true,
    }
  )
}
