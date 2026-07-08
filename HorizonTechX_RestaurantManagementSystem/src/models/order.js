const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
  tableId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Tables', key: 'id' } },
  status: { type: DataTypes.ENUM('OPEN','SERVED','PAID','CANCELLED'), defaultValue: 'OPEN' },
  totalAmount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 }
});

module.exports = Order;
