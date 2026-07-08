// middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware to protect routes — verifies JWT and attaches req.user.
 * Returns { success: false } consistently with the rest of the API.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      const message = err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token';
      return res.status(403).json({ success: false, message });
    }
    req.user = decoded; // payload: { id, role }
    next();
  });
}

module.exports = { authenticate };
