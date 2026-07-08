// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const asyncWrapper = require('./asyncWrapper');

// Protect routes - ensure user is logged in
exports.protect = asyncWrapper(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ status: 'fail', message: 'Not logged in' });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // attach user info to request for later use
  req.user = { id: decoded.id, role: decoded.role };
  next();
});

// Restrict to specific roles (admin, manager, etc.)
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'fail', message: 'You do not have permission to perform this action' });
    }
    next();
  };
};
