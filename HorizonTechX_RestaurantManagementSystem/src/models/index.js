const sequelize = require('../config/db');
const User = require('./user');
const Category = require('./category');
const MenuItem = require('./menuItem');
const Table = require('./table');
const Order = require('./order');
const OrderItem = require('./orderItem');
const Reservation = require('./reservation');
const Inventory = require('./inventory');

Category.hasMany(MenuItem, { foreignKey: 'categoryId', as: 'items' });
MenuItem.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Table.hasMany(Order, { foreignKey: 'tableId', as: 'orders' });
Order.belongsTo(Table, { foreignKey: 'tableId', as: 'table' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

MenuItem.hasMany(OrderItem, { foreignKey: 'menuItemId', as: 'orderItems' });
OrderItem.belongsTo(MenuItem, { foreignKey: 'menuItemId', as: 'menuItem' });

User.hasMany(Reservation, { foreignKey: 'userId', as: 'reservations' });
Reservation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Table.hasMany(Reservation, { foreignKey: 'tableId', as: 'reservations' });
Reservation.belongsTo(Table, { foreignKey: 'tableId', as: 'table' });

MenuItem.hasOne(Inventory, { foreignKey: 'menuItemId', as: 'inventory' });
Inventory.belongsTo(MenuItem, { foreignKey: 'menuItemId', as: 'menuItem' });

module.exports = {
  sequelize,
  User,
  Category,
  MenuItem,
  Table,
  Order,
  OrderItem,
  Reservation,
  Inventory,
};
