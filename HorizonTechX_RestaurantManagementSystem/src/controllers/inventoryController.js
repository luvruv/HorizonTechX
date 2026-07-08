// src/controllers/inventoryController.js
const asyncWrapper = require('../middleware/asyncWrapper');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const Inventory = require('../models/inventory');

// Get inventory list (optionally filter low stock)
exports.getAll = asyncWrapper(async (req, res) => {
  const where = {};
  if (req.query.low === 'true') where.quantity = { $lt: 10 };
  const items = await Inventory.findAll({ where });
  res.status(200).json({ status: 'success', results: items.length, data: { items } });
});

// Update inventory quantity (admin/manager only)
exports.update = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const [rows, [updated]] = await Inventory.update(req.body, {
    where: { id },
    returning: true,
  });
  if (!rows) return res.status(404).json({ status: 'fail', message: 'Inventory item not found' });
  res.status(200).json({ status: 'success', data: { item: updated } });
});
