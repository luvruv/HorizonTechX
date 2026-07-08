const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  updateJobStatus,
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

router.route('/').get(getJobs).post(protect, authorize('employer'), createJob);

router.patch('/:id/status', protect, authorize('employer'), updateJobStatus);

router
  .route('/:id')
  .get(getJobById)
  .put(protect, authorize('employer'), updateJob)
  .delete(protect, authorize('employer'), deleteJob);

module.exports = router;
