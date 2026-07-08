const sequelize = require('../config/db');
const { Op } = require('sequelize');
const { Order, OrderItem, MenuItem, Table, Inventory, Reservation } = require('../models');

const TAX_RATE = parseFloat(process.env.TAX_RATE || '0.05');

function calculateBill(subtotal) {
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
  return { subtotal, taxAmount, totalAmount, taxRate: TAX_RATE };
}

async function createOrder({ userId, tableId, items }) {
  if (!items || !items.length) {
    const err = new Error('Order must contain at least one item');
    err.statusCode = 400;
    throw err;
  }

  return sequelize.transaction(async (t) => {
    const table = await Table.findByPk(tableId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!table) {
      const err = new Error('Table not found');
      err.statusCode = 404;
      throw err;
    }
    if (table.status === 'OCCUPIED' || table.status === 'RESERVED') {
      const err = new Error(`Table is ${table.status.toLowerCase()} and cannot accept new orders`);
      err.statusCode = 400;
      throw err;
    }

    let subtotal = 0;
    const lineItems = [];
    const lowStockWarnings = [];

    for (const item of items) {
      const menuItem = await MenuItem.findByPk(item.menuItemId, { transaction: t });
      if (!menuItem) {
        const err = new Error(`Menu item ${item.menuItemId} does not exist`);
        err.statusCode = 404;
        throw err;
      }
      if (!menuItem.available) {
        const err = new Error(`Menu item "${menuItem.name}" is unavailable`);
        err.statusCode = 400;
        throw err;
      }

      const inventory = await Inventory.findOne({
        where: { menuItemId: menuItem.id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (inventory && inventory.quantity < item.quantity) {
        const err = new Error(`Insufficient inventory for "${menuItem.name}" (available: ${inventory.quantity})`);
        err.statusCode = 400;
        throw err;
      }

      subtotal += Number(menuItem.price) * item.quantity;
      lineItems.push({ menuItem, quantity: item.quantity, price: menuItem.price, inventory });
    }

    const bill = calculateBill(subtotal);

    const order = await Order.create(
      {
        userId,
        tableId,
        status: 'PENDING',
        subtotal: bill.subtotal,
        taxAmount: bill.taxAmount,
        totalAmount: bill.totalAmount,
      },
      { transaction: t }
    );

    for (const line of lineItems) {
      await OrderItem.create(
        {
          orderId: order.id,
          menuItemId: line.menuItem.id,
          quantity: line.quantity,
          price: line.price,
        },
        { transaction: t }
      );

      if (line.inventory) {
        line.inventory.quantity -= line.quantity;
        await line.inventory.save({ transaction: t });
        if (line.inventory.quantity <= line.inventory.lowStockThreshold) {
          lowStockWarnings.push({
            itemName: line.inventory.itemName,
            quantity: line.inventory.quantity,
            threshold: line.inventory.lowStockThreshold,
          });
        }
      }
    }

    table.status = 'OCCUPIED';
    await table.save({ transaction: t });

    const fullOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: 'items', include: [{ model: MenuItem, as: 'menuItem' }] },
        { model: Table, as: 'table' },
      ],
      transaction: t,
    });

    return { order: fullOrder, bill, lowStockWarnings };
  });
}

async function getOrderById(id) {
  return Order.findByPk(id, {
    include: [
      { model: OrderItem, as: 'items', include: [{ model: MenuItem, as: 'menuItem' }] },
      { model: Table, as: 'table' },
    ],
  });
}

async function getAllOrders(filter = {}) {
  return Order.findAll({
    where: filter,
    include: [
      { model: OrderItem, as: 'items', include: [{ model: MenuItem, as: 'menuItem' }] },
      { model: Table, as: 'table' },
    ],
    order: [['createdAt', 'DESC']],
  });
}

async function updateOrderStatus(id, status) {
  const validStatuses = ['PENDING', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    const err = new Error(`Invalid status. Allowed: ${validStatuses.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  return sequelize.transaction(async (t) => {
    const order = await Order.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!order) return null;

    order.status = status;
    await order.save({ transaction: t });

    if (status === 'COMPLETED' || status === 'CANCELLED') {
      const table = await Table.findByPk(order.tableId, { transaction: t });
      if (table) {
        const activeReservations = await Reservation.count({
          where: {
            tableId: table.id,
            status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
          },
          transaction: t,
        });
        table.status = activeReservations > 0 ? 'RESERVED' : 'AVAILABLE';
        await table.save({ transaction: t });
      }
    }

    return getOrderById(order.id);
  });
}

module.exports = {
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  calculateBill,
};
