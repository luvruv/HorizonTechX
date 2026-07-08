const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { create, getOne, getAll, updateStatus } = require('../controllers/orderController');
const validate = require('../middleware/validate');
const { orderSchema } = require('../validators/orderValidator');

router
  .route('/')
  .post(protect, validate(orderSchema), create)
  .get(protect, getAll);

router
  .route('/:id')
  .get(protect, getOne)
  .patch(protect, restrictTo('admin', 'manager'), updateStatus);

module.exports = router;
