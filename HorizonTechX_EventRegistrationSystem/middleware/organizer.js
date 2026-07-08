// middleware/organizer.js
module.exports.isOrganizer = function (req, res, next) {
  // Allows users with role 'organizer' or 'admin' to proceed
  if (req.user && (req.user.role === 'organizer' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ message: 'Organizer privileges required' });
};
