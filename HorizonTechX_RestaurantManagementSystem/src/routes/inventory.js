// src/routes/inventory.js
const express = require('express');
const router = express.Router();
const asyncWrapper = require('../middleware/asyncWrapper');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { getAll, update } = require('../controllers/inventoryController');

// Public list (optional low stock filter)
router
  .route('/')
  .get(asyncWrapper(getAll))
  .patch(protect, restrictTo('admin', 'manager'), asyncWrapper(update));

module.exports = router;
