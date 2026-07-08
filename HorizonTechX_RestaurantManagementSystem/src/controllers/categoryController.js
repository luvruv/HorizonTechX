// src/controllers/categoryController.js
const Category = require('../models/category');

// @desc   Get all categories
// @route  GET /api/categories
// @access Public
exports.getAll = async (req, res, next) => {
  try {
    const categories = await Category.findAll();
    res.status(200).json({ status: 'success', data: { categories } });
  } catch (err) {
    next(err);
  }
};

// @desc   Get single category by ID
// @route  GET /api/categories/:id
// @access Public
exports.getOne = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ status: 'fail', message: 'Category not found' });
    res.status(200).json({ status: 'success', data: { category } });
  } catch (err) {
    next(err);
  }
};

// @desc   Create a new category
// @route  POST /api/categories
// @access Private (admin/manager)
exports.create = async (req, res, next) => {
  try {
    const newCategory = await Category.create(req.body);
    res.status(201).json({ status: 'success', data: { category: newCategory } });
  } catch (err) {
    next(err);
  }
};

// @desc   Update a category
// @route  PATCH /api/categories/:id
// @access Private (admin/manager)
exports.update = async (req, res, next) => {
  try {
    const [rows, [updated]] = await Category.update(req.body, {
      where: { id: req.params.id },
      returning: true,
    });
    if (!rows) return res.status(404).json({ status: 'fail', message: 'Category not found' });
    res.status(200).json({ status: 'success', data: { category: updated } });
  } catch (err) {
    next(err);
  }
};

// @desc   Delete a category
// @route  DELETE /api/categories/:id
// @access Private (admin/manager)
exports.remove = async (req, res, next) => {
  try {
    const rows = await Category.destroy({ where: { id: req.params.id } });
    if (!rows) return res.status(404).json({ status: 'fail', message: 'Category not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
