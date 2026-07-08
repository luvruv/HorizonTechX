// models/Event.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Event model definition
const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 1 },
  },
  availableSeats: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  organizerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: true,
  hooks: {
    beforeCreate: (event) => {
      // Initialize availableSeats to capacity if not set
      if (event.availableSeats === undefined || event.availableSeats === null) {
        event.availableSeats = event.capacity;
      }
    },
  },
});

module.exports = Event;
