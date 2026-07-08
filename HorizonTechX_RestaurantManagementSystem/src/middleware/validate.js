const { validationResult } = require('express-validator');

module.exports = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((validation) => validation.run(req)));
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg })),
    });
  }
  next();
};
