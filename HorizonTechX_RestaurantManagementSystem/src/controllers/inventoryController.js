// src/controllers/inventoryController.js
const asyncWrapper = require('../middleware/asyncWrapper');
const { Inventory, MenuItem } = require('../models');

// @desc   Get all inventory items (with optional low-stock filter)
// @route  GET /api/inventory?low=true
// @access Private (admin/manager)
exports.getAll = asyncWrapper(async (req, res) => {
  const items = await Inventory.findAll({
    include: [{ model: MenuItem, as: 'menuItem', attributes: ['id', 'name', 'price'] }],
    order: [['itemName', 'ASC']],
  });

  const enriched = items.map((item) => {
    const plain = item.toJSON();
    plain.isLowStock = plain.quantity <= plain.lowStockThreshold;
    return plain;
  });

  const filtered = req.query.low === 'true' ? enriched.filter((i) => i.isLowStock) : enriched;
  const lowStockAlerts = enriched.filter((i) => i.isLowStock);

  res.status(200).json({
    status: 'success',
    results: filtered.length,
    data: { items: filtered },
    warnings: lowStockAlerts.length
      ? { lowStockCount: lowStockAlerts.length, items: lowStockAlerts }
      : null,
  });
});

// @desc   Create a new inventory item
// @route  POST /api/inventory
// @access Private (admin/manager)
exports.create = asyncWrapper(async (req, res) => {
  const { itemName, quantity, unit, lowStockThreshold, menuItemId } = req.body;

  if (!itemName || !String(itemName).trim()) {
    return res.status(400).json({ status: 'fail', message: 'itemName is required' });
  }
  if (quantity === undefined || quantity === null) {
    return res.status(400).json({ status: 'fail', message: 'quantity is required' });
  }
  if (isNaN(Number(quantity)) || Number(quantity) < 0) {
    return res.status(400).json({ status: 'fail', message: 'quantity must be a non-negative number' });
  }
  if (lowStockThreshold !== undefined && (isNaN(Number(lowStockThreshold)) || Number(lowStockThreshold) < 0)) {
    return res.status(400).json({ status: 'fail', message: 'lowStockThreshold must be a non-negative number' });
  }

  const item = await Inventory.create({
    itemName: String(itemName).trim(),
    quantity: Number(quantity),
    unit: unit || null,
    lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 5,
    menuItemId: menuItemId || null,
  });

  const plain = item.toJSON();
  plain.isLowStock = plain.quantity <= plain.lowStockThreshold;

  res.status(201).json({ status: 'success', data: { item: plain } });
});

// @desc   Update an inventory item (adjust quantity, threshold, etc.)
// @route  PATCH /api/inventory/:id
// @access Private (admin/manager)
exports.update = asyncWrapper(async (req, res) => {
  const item = await Inventory.findByPk(req.params.id);
  if (!item) {
    return res.status(404).json({ status: 'fail', message: 'Inventory item not found' });
  }

  // Prevent setting quantity to a negative value
  if (req.body.quantity !== undefined) {
    const newQty = Number(req.body.quantity);
    if (isNaN(newQty) || newQty < 0) {
      return res.status(400).json({ status: 'fail', message: 'quantity must be a non-negative number' });
    }
  }
  if (req.body.lowStockThreshold !== undefined) {
    const newThreshold = Number(req.body.lowStockThreshold);
    if (isNaN(newThreshold) || newThreshold < 0) {
      return res.status(400).json({ status: 'fail', message: 'lowStockThreshold must be a non-negative number' });
    }
  }

  await item.update(req.body);
  const plain = item.toJSON();
  plain.isLowStock = plain.quantity <= plain.lowStockThreshold;

  res.status(200).json({
    status: 'success',
    data: { item: plain },
    warning: plain.isLowStock
      ? { message: `Low stock alert: "${plain.itemName}" is below minimum (${plain.quantity} remaining)` }
      : null,
  });
});

// @desc   Restock an inventory item (add to existing quantity)
// @route  POST /api/inventory/:id/restock
// @access Private (admin/manager)
exports.restock = asyncWrapper(async (req, res) => {
  const item = await Inventory.findByPk(req.params.id);
  if (!item) {
    return res.status(404).json({ status: 'fail', message: 'Inventory item not found' });
  }

  const { amount } = req.body;
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ status: 'fail', message: 'amount must be a positive number' });
  }

  const previousQty = item.quantity;
  item.quantity = item.quantity + Number(amount);
  await item.save();

  const plain = item.toJSON();
  plain.isLowStock = plain.quantity <= plain.lowStockThreshold;

  res.status(200).json({
    status: 'success',
    message: `Restocked "${item.itemName}": ${previousQty} → ${item.quantity}`,
    data: { item: plain },
  });
});
