// src/routes/tables.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const asyncWrapper = require('../middleware/asyncWrapper');
const { getAll, getOne, create, update, remove } = require('../controllers/tableController');

router
  .route('/')
  .get(asyncWrapper(getAll))
  .post(protect, restrictTo('admin', 'manager'), asyncWrapper(create));

router
  .route('/:id')
  .get(asyncWrapper(getOne))
  .patch(protect, restrictTo('admin', 'manager'), asyncWrapper(update))
  .delete(protect, restrictTo('admin', 'manager'), asyncWrapper(remove));

module.exports = router;
