// src/validators/orderValidator.js
const { body } = require('express-validator');

// Validation schema for creating an order
exports.orderSchema = [
  body('tableId').isInt({ gt: 0 }).withMessage('tableId must be a positive integer'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('items must be a non‑empty array'),
  body('items.*.menuItemId')
    .isInt({ gt: 0 })
    .withMessage('menuItemId must be a positive integer'),
  body('items.*.quantity')
    .isInt({ gt: 0 })
    .withMessage('quantity must be a positive integer'),
];
