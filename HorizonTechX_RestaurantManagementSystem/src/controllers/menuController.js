// src/controllers/menuController.js
const MenuItem = require('../models/menuItem');

// @desc   Get all menu items
// @route  GET /api/menu
// @access Public
exports.getAll = async (req, res, next) => {
  try {
    const items = await MenuItem.findAll();
    res.status(200).json({ status: 'success', data: { items } });
  } catch (err) {
    next(err);
  }
};

// @desc   Get a single menu item by ID
// @route  GET /api/menu/:id
// @access Public
exports.getOne = async (req, res, next) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ status: 'fail', message: 'Menu item not found' });
    res.status(200).json({ status: 'success', data: { item } });
  } catch (err) {
    next(err);
  }
};

// @desc   Create a new menu item
// @route  POST /api/menu
// @access Private (admin/manager)
exports.create = async (req, res, next) => {
  try {
    const newItem = await MenuItem.create(req.body);
    res.status(201).json({ status: 'success', data: { item: newItem } });
  } catch (err) {
    next(err);
  }
};

// @desc   Update a menu item
// @route  PATCH /api/menu/:id
// @access Private (admin/manager)
exports.update = async (req, res, next) => {
  try {
    const [rows, [updated]] = await MenuItem.update(req.body, {
      where: { id: req.params.id },
      returning: true,
    });
    if (!rows) return res.status(404).json({ status: 'fail', message: 'Menu item not found' });
    res.status(200).json({ status: 'success', data: { item: updated } });
  } catch (err) {
    next(err);
  }
};

// @desc   Delete a menu item
// @route  DELETE /api/menu/:id
// @access Private (admin/manager)
exports.remove = async (req, res, next) => {
  try {
    const rows = await MenuItem.destroy({ where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ status: 'fail', message: 'Menu item not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// @desc   Search menu items (by name or description)
// @route  GET /api/menu/search?q=...
// @access Public
exports.search = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const items = await MenuItem.findAll({ where: { name: { [require('sequelize').Op.iLike]: `%${q}%` } } });
    res.status(200).json({ status: 'success', data: { items } });
  } catch (err) {
    next(err);
  }
};

// @desc   Filter menu items by category
// @route  GET /api/menu/category/:categoryId
// @access Public
exports.filterByCategory = async (req, res, next) => {
  try {
    const items = await MenuItem.findAll({ where: { categoryId: req.params.categoryId } });
    res.status(200).json({ status: 'success', data: { items } });
  } catch (err) {
    next(err);
  }
};
