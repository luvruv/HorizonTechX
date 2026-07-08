// middleware/admin.js
function isAdmin(req, res, next) {
  // Assuming user role is attached by auth middleware
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Admin privileges required' });
}

module.exports = { isAdmin };
