// src/controllers/tableController.js
const asyncWrapper = require('../middleware/asyncWrapper');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const Table = require('../models/table');

// Get all tables (admin/manager) or available tables (public)
exports.getAll = asyncWrapper(async (req, res) => {
  const filter = {};
  if (req.query.available === 'true') filter.status = 'AVAILABLE';
  const tables = await Table.findAll({ where: filter });
  res.status(200).json({ status: 'success', results: tables.length, data: { tables } });
});

// Get single table
exports.getOne = asyncWrapper(async (req, res) => {
  const table = await Table.findByPk(req.params.id);
  if (!table) return res.status(404).json({ status: 'fail', message: 'Table not found' });
  res.status(200).json({ status: 'success', data: { table } });
});

// Create a new table (admin/manager)
exports.create = asyncWrapper(async (req, res) => {
  const newTable = await Table.create(req.body);
  res.status(201).json({ status: 'success', data: { table: newTable } });
});

// Update a table (admin/manager)
exports.update = asyncWrapper(async (req, res) => {
  const [rows, [updated]] = await Table.update(req.body, {
    where: { id: req.params.id },
    returning: true,
  });
  if (!rows) return res.status(404).json({ status: 'fail', message: 'Table not found' });
  res.status(200).json({ status: 'success', data: { table: updated } });
});

// Delete a table (admin/manager)
exports.remove = asyncWrapper(async (req, res) => {
  const rows = await Table.destroy({ where: { id: req.params.id } });
  if (!rows) return res.status(404).json({ status: 'fail', message: 'Table not found' });
  res.status(204).send();
});
