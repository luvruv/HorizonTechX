// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Helper: sign a JWT
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

// Helper: validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

// Helper: validate password strength (≥8 chars, 1 uppercase, 1 digit, 1 special)
function validatePassword(password) {
  if (!password || password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one digit';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    return 'Password must contain at least one special character';
  return null;
}

// @desc   Register a new user
// @route  POST /api/auth/register
// @access Public (Customer role only — Admin/Manager must be seeded)
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // --- Input Validation ---
    if (!name || !String(name).trim()) {
      return res.status(400).json({ status: 'fail', message: 'Name is required' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ status: 'fail', message: 'A valid email is required' });
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ status: 'fail', message: passwordError });
    }

    // Only 'Customer' is publicly registrable; Admin/Manager are seeded
    const allowedRoles = ['Customer'];
    const assignedRole = allowedRoles.includes(role) ? role : 'Customer';

    const existing = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return res.status(409).json({ status: 'fail', message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: String(name).trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: assignedRole,
    });

    const token = signToken({ id: user.id, role: user.role });
    res.status(201).json({
      status: 'success',
      token,
      data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    });
  } catch (err) {
    next(err);
  }
};

// @desc   Login user
// @route  POST /api/auth/login
// @access Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ status: 'fail', message: 'A valid email is required' });
    }
    if (!password) {
      return res.status(400).json({ status: 'fail', message: 'Password is required' });
    }

    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      // Deliberate: same message for wrong email and wrong password (prevents enumeration)
      return res.status(401).json({ status: 'fail', message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ status: 'fail', message: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, role: user.role });
    res.status(200).json({
      status: 'success',
      token,
      data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    });
  } catch (err) {
    next(err);
  }
};

// @desc   Logout (client discards token)
// @route  POST /api/auth/logout
// @access Private
exports.logout = async (req, res, next) => {
  // Token-based logout: client clears the token. A blocklist can be added here.
  res.status(200).json({ status: 'success', message: 'Logged out successfully' });
};
