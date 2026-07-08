const express = require('express');
const router = express.Router();
const { uploadResume, getMyResumes, deleteResume, setDefaultResume } = require('../controllers/resumeController');
const { protect, authorize } = require('../middleware/auth');
const { uploadResume: uploadMiddleware } = require('../middleware/upload');

router.post('/upload', protect, authorize('candidate'), uploadMiddleware.single('resume'), uploadResume);
router.get('/my', protect, authorize('candidate'), getMyResumes);
router.patch('/:id/default', protect, authorize('candidate'), setDefaultResume);
router.delete('/:id', protect, authorize('candidate'), deleteResume);

module.exports = router;
