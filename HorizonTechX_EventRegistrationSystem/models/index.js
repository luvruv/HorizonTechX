// models/index.js
const { sequelize } = require('../config/database');
const User = require('./User');
const Event = require('./Event');
const Registration = require('./Registration');

// Associations
User.hasMany(Registration, { foreignKey: 'userId', as: 'registrations' });
Registration.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Event.hasMany(Registration, { foreignKey: 'eventId', as: 'registrations' });
Registration.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

module.exports = {
  sequelize,
  User,
  Event,
  Registration,
};
