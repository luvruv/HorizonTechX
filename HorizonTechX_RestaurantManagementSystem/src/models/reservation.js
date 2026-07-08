const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Reservation = sequelize.define('Reservation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
  tableId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Tables', key: 'id' } },
  reservationTime: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.ENUM('PENDING','CONFIRMED','CANCELLED','COMPLETED'), defaultValue: 'PENDING' }
}, {
  timestamps: true
});

module.exports = Reservation;
