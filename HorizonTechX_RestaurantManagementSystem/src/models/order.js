const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TAX_RATE = parseFloat(process.env.TAX_RATE || '0.05');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  tableId: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('PENDING', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'PENDING',
  },
  subtotal: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  taxAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  totalAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
});

Order.TAX_RATE = TAX_RATE;

module.exports = Order;
