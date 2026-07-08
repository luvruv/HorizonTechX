// src/routes/reservations.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const asyncWrapper = require('../middleware/asyncWrapper');
const { create, getOne, getAll, cancel } = require('../controllers/reservationController');
const validate = require('../middleware/validate');
const { reservationSchema } = require('../validators/reservationValidator');

router
  .route('/')
  .post(protect, validate(reservationSchema), asyncWrapper(create))
  .get(protect, asyncWrapper(getAll));

router
  .route('/:id')
  .get(protect, asyncWrapper(getOne))
  .delete(protect, asyncWrapper(cancel));

module.exports = router;
