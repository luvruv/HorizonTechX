const jwt = require('jsonwebtoken');

/**
 * Signs a JWT embedding the user's id and role.
 * The role is embedded so `middleware/auth.js` knows which
 * collection (Employer/Candidate/Admin) to look the user up in.
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
