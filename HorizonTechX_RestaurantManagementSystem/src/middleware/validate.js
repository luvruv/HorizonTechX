// src/middleware/validate.js
const { validationResult } = require('express-validator');

module.exports = schema => (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      errors: errors.array().map(err => ({ field: err.param, message: err.msg }))
    });
  }
  next();
};
