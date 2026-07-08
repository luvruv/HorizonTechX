// src/routes/admin.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  getSalesSummary,
  getPopularItems,
  getReservationsReport,
  getSalesReport,
  getInventoryAlerts,
} = require('../controllers/adminController');

// All admin/manager routes require authentication + role restriction
router.use(protect, restrictTo('admin', 'manager'));

router.get('/stats/summary', getSalesSummary);
router.get('/stats/sales', getSalesReport);
router.get('/stats/popular-items', getPopularItems);
router.get('/stats/reservations', getReservationsReport);
router.get('/stats/inventory-alerts', getInventoryAlerts);

// Keep legacy paths for backwards compatibility
router.get('/sales', getSalesSummary);
router.get('/sales-report', getSalesReport);
router.get('/popular-items', getPopularItems);
router.get('/reservations', getReservationsReport);
router.get('/inventory-alerts', getInventoryAlerts);

module.exports = router;
