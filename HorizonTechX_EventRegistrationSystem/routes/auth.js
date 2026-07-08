// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { validateEmail, validatePassword } = require('../utils/validators');

const router = express.Router();

// Rate limit: max 20 auth attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again after 15 minutes.' },
});

// @desc   Register a new user (role: 'user' or 'organizer' only — admin accounts are seeded)
// @route  POST /api/auth/register
// @access Public
router.post('/register', authLimiter, async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }

  const emailError = validateEmail(email);
  if (emailError) return res.status(400).json({ success: false, message: emailError });

  const passwordError = validatePassword(password);
  if (passwordError) return res.status(400).json({ success: false, message: passwordError });

  // Admin accounts must be seeded — block public registration of privileged roles
  const allowedRoles = ['user', 'organizer'];
  const assignedRole = allowedRoles.includes(role) ? role : 'user';

  try {
    const existing = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User already exists with this email' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: String(name).trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashed,
      role: assignedRole,
    });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// @desc   Login user
// @route  POST /api/auth/login
// @access Public
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  const emailError = validateEmail(email);
  if (emailError) return res.status(400).json({ success: false, message: emailError });
  if (!password) return res.status(400).json({ success: false, message: 'Password is required' });

  try {
    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    // Deliberate: same message for wrong email vs wrong password (prevents enumeration)
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
