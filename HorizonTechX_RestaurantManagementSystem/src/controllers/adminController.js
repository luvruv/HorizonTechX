// src/controllers/adminController.js
const { Order, OrderItem, MenuItem, Reservation, Inventory } = require('../models');
const { fn, col, literal, Op } = require('sequelize');
const sequelize = require('../config/db');

// @desc   Platform sales summary (total revenue, order counts)
// @route  GET /api/admin/stats/summary
// @access Private (admin/manager)
exports.getSalesSummary = async (req, res, next) => {
  try {
    const totalRevenue = (await Order.sum('totalAmount', { where: { status: 'COMPLETED' } })) || 0;
    const ordersCount = await Order.count();
    const pendingOrders = await Order.count({
      where: { status: { [Op.in]: ['PENDING', 'PREPARING', 'READY'] } },
    });
    const cancelledOrders = await Order.count({ where: { status: 'CANCELLED' } });
    const completedOrders = await Order.count({ where: { status: 'COMPLETED' } });

    res.status(200).json({
      status: 'success',
      data: { totalRevenue, ordersCount, pendingOrders, completedOrders, cancelledOrders },
    });
  } catch (err) {
    next(err);
  }
};

// @desc   Most ordered menu items (top 10)
// @route  GET /api/admin/stats/popular-items
// @access Private (admin/manager)
exports.getPopularItems = async (req, res, next) => {
  try {
    const popular = await OrderItem.findAll({
      attributes: [
        'menuItemId',
        [fn('COUNT', col('OrderItem.menuItemId')), 'orderCount'],
        [fn('SUM', col('OrderItem.quantity')), 'totalQuantity'],
      ],
      include: [{ model: MenuItem, as: 'menuItem', attributes: ['id', 'name', 'price'] }],
      group: ['OrderItem.menuItemId', 'menuItem.id', 'menuItem.name', 'menuItem.price'],
      order: [[literal('"orderCount"'), 'DESC']],
      limit: 10,
    });
    res.status(200).json({ status: 'success', data: { popular } });
  } catch (err) {
    next(err);
  }
};

// @desc   Reservations grouped by date
// @route  GET /api/admin/stats/reservations
// @access Private (admin/manager)
exports.getReservationsReport = async (req, res, next) => {
  try {
    // strftime is SQLite-compatible; use DATE() for MySQL
    const report = await Reservation.findAll({
      attributes: [
        [fn('strftime', '%Y-%m-%d', col('reservationTime')), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('strftime', '%Y-%m-%d', col('reservationTime'))],
      order: [[literal('date'), 'DESC']],
    });
    res.status(200).json({ status: 'success', data: { report } });
  } catch (err) {
    next(err);
  }
};

// @desc   Sales report grouped by period (daily/weekly/monthly)
// @route  GET /api/admin/stats/sales?period=daily|weekly|monthly
// @access Private (admin/manager)
exports.getSalesReport = async (req, res, next) => {
  try {
    const { period = 'daily' } = req.query;

    // SQLite uses strftime; PostgreSQL uses TO_CHAR — using strftime for SQLite compatibility
    let dateFormat;
    if (period === 'weekly') dateFormat = '%Y-%W';
    else if (period === 'monthly') dateFormat = '%Y-%m';
    else dateFormat = '%Y-%m-%d';

    const report = await Order.findAll({
      attributes: [
        [fn('strftime', dateFormat, col('createdAt')), 'period'],
        [fn('COUNT', col('id')), 'orderCount'],
        [fn('SUM', col('totalAmount')), 'revenue'],
        [fn('SUM', col('subtotal')), 'subtotal'],
        [fn('SUM', col('taxAmount')), 'taxCollected'],
      ],
      where: { status: 'COMPLETED' },
      group: [fn('strftime', dateFormat, col('createdAt'))],
      order: [[literal('period'), 'DESC']],
    });

    res.status(200).json({ status: 'success', data: { period, report } });
  } catch (err) {
    next(err);
  }
};

// @desc   All low-stock inventory items
// @route  GET /api/admin/stats/inventory-alerts
// @access Private (admin/manager)
exports.getInventoryAlerts = async (req, res, next) => {
  try {
    const items = await Inventory.findAll({
      include: [{ model: MenuItem, as: 'menuItem', attributes: ['id', 'name'] }],
    });

    const lowStock = items
      .map((i) => i.toJSON())
      .filter((i) => i.quantity <= i.lowStockThreshold)
      .map((i) => ({
        ...i,
        deficit: i.lowStockThreshold - i.quantity,
      }));

    res.status(200).json({
      status: 'success',
      results: lowStock.length,
      data: { alerts: lowStock },
    });
  } catch (err) {
    next(err);
  }
};
