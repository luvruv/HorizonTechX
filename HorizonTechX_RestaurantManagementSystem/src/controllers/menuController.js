// src/controllers/menuController.js
const { Op } = require('sequelize');
const MenuItem = require('../models/menuItem');
const Category = require('../models/category');

// @desc   Get all menu items (with optional pagination, category filter, availability filter)
// @route  GET /api/menu?page=&limit=&categoryId=&available=&q=
// @access Public
exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, categoryId, available, q } = req.query;
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const where = {};

    // Search by name or description (Op.like is SQLite/MySQL compatible)
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
      ];
    }
    if (categoryId) {
      where.categoryId = parseInt(categoryId, 10);
    }
    if (available === 'true') {
      where.available = true;
    } else if (available === 'false') {
      where.available = false;
    }

    const { rows, count } = await MenuItem.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      order: [['name', 'ASC']],
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
    });

    res.status(200).json({
      status: 'success',
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.ceil(count / parsedLimit),
      data: { items: rows },
    });
  } catch (err) {
    next(err);
  }
};

// @desc   Get a single menu item by ID
// @route  GET /api/menu/:id
// @access Public
exports.getOne = async (req, res, next) => {
  try {
    const item = await MenuItem.findByPk(req.params.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
    });
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
    const { name, price, categoryId } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ status: 'fail', message: 'name is required' });
    }
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ status: 'fail', message: 'price must be a non-negative number' });
    }
    if (!categoryId) {
      return res.status(400).json({ status: 'fail', message: 'categoryId is required' });
    }

    const newItem = await MenuItem.create({
      ...req.body,
      name: String(name).trim(),
      price: Number(price),
    });
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
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ status: 'fail', message: 'Menu item not found' });

    // Validate fields if provided
    if (req.body.price !== undefined && (isNaN(Number(req.body.price)) || Number(req.body.price) < 0)) {
      return res.status(400).json({ status: 'fail', message: 'price must be a non-negative number' });
    }
    if (req.body.name !== undefined && !String(req.body.name).trim()) {
      return res.status(400).json({ status: 'fail', message: 'name cannot be empty' });
    }

    await item.update(req.body);
    res.status(200).json({ status: 'success', data: { item } });
  } catch (err) {
    next(err);
  }
};

// @desc   Delete a menu item
// @route  DELETE /api/menu/:id
// @access Private (admin/manager)
exports.remove = async (req, res, next) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ status: 'fail', message: 'Menu item not found' });
    await item.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// @desc   Search menu items by name/description
// @route  GET /api/menu/search?q=...
// @access Public
exports.search = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.status(400).json({ status: 'fail', message: 'Query parameter q is required' });
    }
    // Op.like is SQLite/MySQL compatible (Op.iLike is PostgreSQL-only)
    const items = await MenuItem.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
        ],
      },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
    });
    res.status(200).json({ status: 'success', results: items.length, data: { items } });
  } catch (err) {
    next(err);
  }
};

// @desc   Filter menu items by category
// @route  GET /api/menu/category/:categoryId
// @access Public
exports.filterByCategory = async (req, res, next) => {
  try {
    const items = await MenuItem.findAll({
      where: { categoryId: req.params.categoryId },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
    });
    res.status(200).json({ status: 'success', results: items.length, data: { items } });
  } catch (err) {
    next(err);
  }
};
