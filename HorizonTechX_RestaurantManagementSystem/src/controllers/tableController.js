// src/controllers/tableController.js
const asyncWrapper = require('../middleware/asyncWrapper');
const Table = require('../models/table');

// @desc   Get all tables (optionally filter by availability)
// @route  GET /api/tables?available=true
// @access Public (customers see available only; admin/manager see all)
exports.getAll = asyncWrapper(async (req, res) => {
  const where = {};
  if (req.query.available === 'true') where.status = 'AVAILABLE';
  if (req.query.status) where.status = String(req.query.status).toUpperCase();

  const tables = await Table.findAll({ where, order: [['number', 'ASC']] });
  res.status(200).json({ status: 'success', results: tables.length, data: { tables } });
});

// @desc   Get a single table
// @route  GET /api/tables/:id
// @access Public
exports.getOne = asyncWrapper(async (req, res) => {
  const table = await Table.findByPk(req.params.id);
  if (!table) return res.status(404).json({ status: 'fail', message: 'Table not found' });
  res.status(200).json({ status: 'success', data: { table } });
});

// @desc   Create a new table
// @route  POST /api/tables
// @access Private (admin/manager)
exports.create = asyncWrapper(async (req, res) => {
  const { number, capacity } = req.body;

  if (!number || !Number.isInteger(Number(number)) || Number(number) < 1) {
    return res.status(400).json({ status: 'fail', message: 'number must be a positive integer' });
  }
  if (!capacity || !Number.isInteger(Number(capacity)) || Number(capacity) < 1) {
    return res.status(400).json({ status: 'fail', message: 'capacity must be a positive integer' });
  }

  // Check for duplicate table number
  const existing = await Table.findOne({ where: { number: Number(number) } });
  if (existing) {
    return res.status(409).json({ status: 'fail', message: `Table number ${number} already exists` });
  }

  const newTable = await Table.create({ number: Number(number), capacity: Number(capacity) });
  res.status(201).json({ status: 'success', data: { table: newTable } });
});

// @desc   Update a table (number, capacity, or status)
// @route  PATCH /api/tables/:id
// @access Private (admin/manager)
exports.update = asyncWrapper(async (req, res) => {
  const table = await Table.findByPk(req.params.id);
  if (!table) return res.status(404).json({ status: 'fail', message: 'Table not found' });

  const validStatuses = ['AVAILABLE', 'OCCUPIED', 'RESERVED'];
  if (req.body.status && !validStatuses.includes(String(req.body.status).toUpperCase())) {
    return res.status(400).json({
      status: 'fail',
      message: `status must be one of: ${validStatuses.join(', ')}`,
    });
  }
  if (req.body.capacity !== undefined) {
    const cap = Number(req.body.capacity);
    if (!Number.isInteger(cap) || cap < 1) {
      return res.status(400).json({ status: 'fail', message: 'capacity must be a positive integer' });
    }
  }
  if (req.body.number !== undefined) {
    const num = Number(req.body.number);
    if (!Number.isInteger(num) || num < 1) {
      return res.status(400).json({ status: 'fail', message: 'number must be a positive integer' });
    }
    // Check duplicate number (exclude self)
    const duplicate = await Table.findOne({ where: { number: num } });
    if (duplicate && duplicate.id !== table.id) {
      return res.status(409).json({ status: 'fail', message: `Table number ${num} already exists` });
    }
  }

  await table.update(req.body);
  res.status(200).json({ status: 'success', data: { table } });
});

// @desc   Delete a table
// @route  DELETE /api/tables/:id
// @access Private (admin/manager)
exports.remove = asyncWrapper(async (req, res) => {
  const table = await Table.findByPk(req.params.id);
  if (!table) return res.status(404).json({ status: 'fail', message: 'Table not found' });

  if (table.status === 'OCCUPIED') {
    return res.status(409).json({
      status: 'fail',
      message: 'Cannot delete an occupied table. Please complete or cancel the active order first.',
    });
  }

  await table.destroy();
  res.status(204).send();
});
