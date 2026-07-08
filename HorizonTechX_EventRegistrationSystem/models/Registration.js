// models/Registration.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Registration = sequelize.define('Registration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Events', key: 'id' }
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'canceled'),
    defaultValue: 'pending',
  },
}, {
  timestamps: true,
});

// Associations are defined after all models are imported in a central file.
module.exports = Registration;
