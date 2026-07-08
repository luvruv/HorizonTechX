// src/routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../controllers/authController');
const asyncWrapper = require('../middleware/asyncWrapper');

router.post('/register', asyncWrapper(register));
router.post('/login', asyncWrapper(login));
router.post('/logout', asyncWrapper(logout));

module.exports = router;
