require('dotenv').config();
const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  Category,
  MenuItem,
  Table,
  Inventory,
} = require('../models');

async function seed() {
  try {
    await sequelize.sync({ alter: true });

    let admin = await User.findOne({ where: { email: 'admin@restaurant.com' } });
    if (!admin) {
      admin = await User.create({
        name: 'Restaurant Admin',
        email: 'admin@restaurant.com',
        passwordHash: await bcrypt.hash('admin123', 12),
        role: 'admin',
      });
      console.log('Admin: admin@restaurant.com / admin123');
    }

    let manager = await User.findOne({ where: { email: 'manager@restaurant.com' } });
    if (!manager) {
      manager = await User.create({
        name: 'Floor Manager',
        email: 'manager@restaurant.com',
        passwordHash: await bcrypt.hash('manager123', 12),
        role: 'manager',
      });
      console.log('Manager: manager@restaurant.com / manager123');
    }

    let category = await Category.findOne({ where: { name: 'Main Course' } });
    if (!category) {
      category = await Category.create({ name: 'Main Course' });
    }

    let appetizer = await Category.findOne({ where: { name: 'Appetizers' } });
    if (!appetizer) {
      appetizer = await Category.create({ name: 'Appetizers' });
    }

    const tableCount = await Table.count();
    if (tableCount === 0) {
      await Table.bulkCreate([
        { number: 1, capacity: 2, status: 'AVAILABLE' },
        { number: 2, capacity: 4, status: 'AVAILABLE' },
        { number: 3, capacity: 6, status: 'AVAILABLE' },
      ]);
      console.log('Created sample tables');
    }

    let pasta = await MenuItem.findOne({ where: { name: 'Truffle Pasta' } });
    if (!pasta) {
      pasta = await MenuItem.create({
        name: 'Truffle Pasta',
        description: 'Creamy pasta with truffle oil',
        price: 18.99,
        categoryId: category.id,
        available: true,
      });
    }

    let salad = await MenuItem.findOne({ where: { name: 'Caesar Salad' } });
    if (!salad) {
      salad = await MenuItem.create({
        name: 'Caesar Salad',
        description: 'Classic Caesar with parmesan',
        price: 9.99,
        categoryId: appetizer.id,
        available: true,
      });
    }

    const inventoryCount = await Inventory.count();
    if (inventoryCount === 0) {
      await Inventory.bulkCreate([
        { itemName: 'Pasta Stock', menuItemId: pasta.id, quantity: 50, unit: 'servings', lowStockThreshold: 10 },
        { itemName: 'Salad Stock', menuItemId: salad.id, quantity: 30, unit: 'servings', lowStockThreshold: 5 },
      ]);
      console.log('Created inventory items');
    }

    console.log('Seed completed');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
