// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Helper to sign JWT
const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
};

// @desc   Register a new user
// @route  POST /api/auth/register
// @access Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'Email already in use' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || 'Customer',
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
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ status: 'fail', message: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res
        .status(401)
        .json({ status: 'fail', message: 'Invalid credentials' });
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
  // Token blacklist could be added later.
  res.status(200).json({ status: 'success', message: 'Logged out' });
};
