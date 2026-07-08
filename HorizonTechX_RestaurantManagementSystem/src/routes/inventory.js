// src/routes/inventory.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { getAll, update, create, restock } = require('../controllers/inventoryController');

// GET all inventory / POST create new item
router
  .route('/')
  .get(protect, restrictTo('admin', 'manager'), getAll)
  .post(protect, restrictTo('admin', 'manager'), create);

// PATCH update inventory item
router.route('/:id').patch(protect, restrictTo('admin', 'manager'), update);

// POST restock — add quantity to an existing item
router.route('/:id/restock').post(protect, restrictTo('admin', 'manager'), restock);

module.exports = router;
