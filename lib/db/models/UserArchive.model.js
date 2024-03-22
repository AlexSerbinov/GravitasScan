const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  return sequelize.define(
    "user_archive",
    {
      protocol: {
        type: DataTypes.TEXT,
        unique: true,
        allowNull: false,
      },
      archive_users: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      listener_users: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      last_subgraph_modify: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      last_archive_modify: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
    }
  )
}
