const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Employer = require('../models/Employer');
const Candidate = require('../models/Candidate');
const Admin = require('../models/Admin');
const { ROLES } = require('../utils/constants');

const MODEL_BY_ROLE = {
  [ROLES.EMPLOYER]: Employer,
  [ROLES.CANDIDATE]: Candidate,
  [ROLES.ADMIN]: Admin,
};

/**
 * Verifies the JWT from the Authorization header and attaches
 * `req.user` (the document) and `req.userRole` to the request.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const Model = MODEL_BY_ROLE[decoded.role];

    if (!Model) {
      res.status(401);
      throw new Error('Not authorized, invalid token role');
    }

    const user = await Model.findById(decoded.id);
    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user no longer exists');
    }

    req.user = user;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token invalid or expired');
  }
});

/**
 * Restricts a route to one or more roles.
 * Usage: authorize('employer', 'admin')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.userRole || !roles.includes(req.userRole)) {
    res.status(403);
    throw new Error(`Access denied: requires role(s) [${roles.join(', ')}]`);
  }
  next();
};

module.exports = { protect, authorize };
