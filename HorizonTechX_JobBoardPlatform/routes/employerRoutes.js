const express = require('express');
const router = express.Router();
const {
  getEmployerById,
  updateEmployerProfile,
  getEmployerJobs,
  getEmployerDashboardStats,
} = require('../controllers/employerController');
const { protect, authorize } = require('../middleware/auth');

// NOTE: static paths must be registered before the "/:id" dynamic path
router.put('/profile', protect, authorize('employer'), updateEmployerProfile);
router.get('/dashboard/stats', protect, authorize('employer'), getEmployerDashboardStats);
router.get('/:id/jobs', getEmployerJobs);
router.get('/:id', getEmployerById);

module.exports = router;
