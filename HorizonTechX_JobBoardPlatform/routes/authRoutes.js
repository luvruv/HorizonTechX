const express = require('express');
const router = express.Router();
const { registerEmployer, registerCandidate, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register/employer', registerEmployer);
router.post('/register/candidate', registerCandidate);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
