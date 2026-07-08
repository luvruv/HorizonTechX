const express = require('express');
const router = express.Router();
const {
  getEmployerById,
  updateEmployerProfile,
  getEmployerJobs,
  getEmployerDashboardStats,
  getEmployerDashboard,
} = require('../controllers/employerController');
const { protect, authorize } = require('../middleware/auth');

router.put('/profile', protect, authorize('employer'), updateEmployerProfile);
router.get('/dashboard/stats', protect, authorize('employer'), getEmployerDashboardStats);
router.get('/dashboard', protect, authorize('employer'), getEmployerDashboard);
router.get('/:id/jobs', getEmployerJobs);
router.get('/:id', getEmployerById);

module.exports = router;
