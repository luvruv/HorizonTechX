const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { create, getOne, getAll, cancel } = require('../controllers/reservationController');
const validate = require('../middleware/validate');
const { reservationSchema } = require('../validators/reservationValidator');

router
  .route('/')
  .post(protect, validate(reservationSchema), create)
  .get(protect, getAll);

router
  .route('/:id')
  .get(protect, getOne)
  .delete(protect, cancel);

module.exports = router;
