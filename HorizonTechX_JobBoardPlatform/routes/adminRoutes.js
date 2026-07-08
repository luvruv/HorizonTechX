const express = require('express');
const router = express.Router();
const {
  getOverviewStats,
  getJobsByCategory,
  getApplicationsFunnel,
  getTopEmployers,
  listEmployers,
  listCandidates,
  setEmployerVerification,
  adminDeleteJob,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Every route below is admin-only.
router.use(protect, authorize('admin'));

router.get('/stats/overview', getOverviewStats);
router.get('/stats/jobs-by-category', getJobsByCategory);
router.get('/stats/applications-funnel', getApplicationsFunnel);
router.get('/stats/top-employers', getTopEmployers);

router.get('/employers', listEmployers);
router.get('/candidates', listCandidates);
router.patch('/employers/:id/verify', setEmployerVerification);
router.delete('/jobs/:id', adminDeleteJob);

module.exports = router;
