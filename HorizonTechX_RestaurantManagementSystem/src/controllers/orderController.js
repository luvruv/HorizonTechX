// src/controllers/orderController.js
const asyncWrapper = require('../middleware/asyncWrapper');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { createOrder, getOrderById, getAllOrders, updateOrderStatus } = require('../services/orderService');

// Create a new order (customer)
exports.create = asyncWrapper(async (req, res) => {
  const { tableId, items } = req.body; // items: [{ menuItemId, quantity }]
  const userId = req.user.id;
  const order = await createOrder({ userId, tableId, items });
  res.status(201).json({ status: 'success', data: { order } });
});

// Get a single order (owner or admin/manager)
exports.getOne = asyncWrapper(async (req, res) => {
  const order = await getOrderById(req.params.id);
  if (!order) return res.status(404).json({ status: 'fail', message: 'Order not found' });
  // allow access if user owns the order or has privileged role
  if (order.userId !== req.user.id && !['admin','manager'].includes(req.user.role)) {
    return res.status(403).json({ status: 'fail', message: 'Forbidden' });
  }
  res.status(200).json({ status: 'success', data: { order } });
});

// Get all orders (admin/manager) or own orders (customer)
exports.getAll = asyncWrapper(async (req, res) => {
  let orders;
  if (['admin','manager'].includes(req.user.role)) {
    orders = await getAllOrders();
  } else {
    orders = await getAllOrders({ userId: req.user.id });
  }
  res.status(200).json({ status: 'success', results: orders.length, data: { orders } });
});

// Update order status (admin/manager)
exports.updateStatus = asyncWrapper(async (req, res) => {
  const { status } = req.body; // expected status enum
  const updated = await updateOrderStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ status: 'fail', message: 'Order not found' });
  res.status(200).json({ status: 'success', data: { order: updated } });
});
