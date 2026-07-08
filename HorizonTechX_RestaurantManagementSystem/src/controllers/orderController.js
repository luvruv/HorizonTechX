// src/controllers/orderController.js
const asyncWrapper = require('../middleware/asyncWrapper');
const { createOrder, getOrderById, getAllOrders, updateOrderStatus } = require('../services/orderService');

exports.create = asyncWrapper(async (req, res) => {
  const { tableId, items } = req.body;
  const userId = req.user.id;
  const result = await createOrder({ userId, tableId, items });
  res.status(201).json({
    status: 'success',
    data: {
      order: result.order,
      bill: result.bill,
      lowStockWarnings: result.lowStockWarnings,
    },
  });
});

exports.getOne = asyncWrapper(async (req, res) => {
  const order = await getOrderById(req.params.id);
  if (!order) return res.status(404).json({ status: 'fail', message: 'Order not found' });
  if (order.userId !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({ status: 'fail', message: 'Forbidden' });
  }
  res.status(200).json({ status: 'success', data: { order } });
});

exports.getAll = asyncWrapper(async (req, res) => {
  let orders;
  if (['admin', 'manager'].includes(req.user.role)) {
    orders = await getAllOrders();
  } else {
    orders = await getAllOrders({ userId: req.user.id });
  }
  res.status(200).json({ status: 'success', results: orders.length, data: { orders } });
});

exports.updateStatus = asyncWrapper(async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ status: 'fail', message: 'Status is required' });
  const updated = await updateOrderStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ status: 'fail', message: 'Order not found' });
  res.status(200).json({ status: 'success', data: { order: updated } });
});
