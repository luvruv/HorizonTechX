const express = require('express');
const router = express.Router();
const {
  applyToJob,
  getMyApplications,
  getApplicationsForJob,
  getApplicationById,
  updateApplicationStatus,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('candidate'), applyToJob);
router.get('/my', protect, authorize('candidate'), getMyApplications);
router.get('/job/:jobId', protect, authorize('employer'), getApplicationsForJob);
router.patch('/:id/status', protect, authorize('employer'), updateApplicationStatus);
router.get('/:id', protect, authorize('candidate', 'employer', 'admin'), getApplicationById);

module.exports = router;
