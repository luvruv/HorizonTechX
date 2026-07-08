const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Table = sequelize.define('Table', {
  number: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  capacity: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('AVAILABLE','OCCUPIED','RESERVED'), defaultValue: 'AVAILABLE' }
});

module.exports = Table;
