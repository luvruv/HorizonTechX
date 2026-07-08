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
  listJobs,
  deleteCandidate,
  deleteEmployer,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Every route below is admin-only.
router.use(protect, authorize('admin'));

// Stats
router.get('/stats/overview', getOverviewStats);
router.get('/stats/jobs-by-category', getJobsByCategory);
router.get('/stats/applications-funnel', getApplicationsFunnel);
router.get('/stats/top-employers', getTopEmployers);

// Employers Moderation
router.get('/employers', listEmployers);
router.delete('/employers/:id', deleteEmployer);
router.patch('/employers/:id/verify', setEmployerVerification);

// Candidates Moderation
router.get('/candidates', listCandidates);
router.delete('/candidates/:id', deleteCandidate);

// Job listings Moderation
router.get('/jobs', listJobs);
router.delete('/jobs/:id', adminDeleteJob);

module.exports = router;
