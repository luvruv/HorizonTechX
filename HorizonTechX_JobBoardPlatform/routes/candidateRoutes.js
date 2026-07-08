const express = require('express');
const router = express.Router();
const {
  getCandidateById,
  updateCandidateProfile,
  getCandidateDashboard,
} = require('../controllers/candidateController');
const { protect, authorize } = require('../middleware/auth');

router.put('/profile', protect, authorize('candidate'), updateCandidateProfile);
router.get('/dashboard/applications', protect, authorize('candidate'), getCandidateDashboard);
router.get('/:id', protect, authorize('candidate', 'employer', 'admin'), getCandidateById);

module.exports = router;
