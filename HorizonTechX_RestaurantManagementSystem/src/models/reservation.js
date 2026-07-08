const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Reservation = sequelize.define('Reservation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  tableId: { type: DataTypes.INTEGER, allowNull: false },
  reservationTime: { type: DataTypes.DATE, allowNull: false },
  guestCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  status: {
    type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'),
    defaultValue: 'PENDING',
  },
}, {
  timestamps: true,
});

module.exports = Reservation;
