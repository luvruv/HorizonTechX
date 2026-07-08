// src/routes/api.js
const express = require('express');
const router = express.Router();

// Import sub-routers
const authRouter = require('./auth');
const categoryRouter = require('./categories');
const menuRouter = require('./menu');
const orderRouter = require('./orders');
const tableRouter = require('./tables');
const reservationRouter = require('./reservations');
const inventoryRouter = require('./inventory');
const adminRouter = require('./admin');

router.use('/auth', authRouter);
router.use('/categories', categoryRouter);
router.use('/menu', menuRouter);
router.use('/orders', orderRouter);
router.use('/tables', tableRouter);
router.use('/reservations', reservationRouter);
router.use('/inventory', inventoryRouter);
router.use('/admin', adminRouter);

module.exports = router;
