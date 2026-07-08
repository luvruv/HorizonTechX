// src/validators/reservationValidator.js
const { body } = require('express-validator');

exports.reservationSchema = [
  body('tableId')
    .isInt({ gt: 0 })
    .withMessage('tableId must be a positive integer'),
  body('reservationTime')
    .isISO8601()
    .withMessage('reservationTime must be a valid ISO date'),
  body('guestCount')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('guestCount must be a positive integer'),
];
