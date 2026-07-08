// src/routes/orders.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const asyncWrapper = require('../middleware/asyncWrapper');
const { create, getOne, getAll, updateStatus } = require('../controllers/orderController');
const validate = require('../middleware/validate');
const { orderSchema } = require('../validators/orderValidator');

router
  .route('/')
  .post(protect, validate(orderSchema), asyncWrapper(create))
  .get(protect, asyncWrapper(getAll));

router
  .route('/:id')
  .get(protect, asyncWrapper(getOne))
  .patch(protect, restrictTo('admin','manager'), asyncWrapper(updateStatus));

module.exports = router;
