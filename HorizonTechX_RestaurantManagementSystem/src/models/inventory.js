const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Inventory = sequelize.define('Inventory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  itemName: { type: DataTypes.STRING, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  unit: { type: DataTypes.STRING },
  lowStockThreshold: { type: DataTypes.INTEGER, defaultValue: 5 }
}, {
  timestamps: true
});

module.exports = Inventory;
