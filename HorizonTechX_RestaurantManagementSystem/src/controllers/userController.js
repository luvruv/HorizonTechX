// src/controllers/userController.js
const User = require('../models/user');

// @desc   Get logged‑in user profile
// @route  GET /api/users/profile
// @access Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['passwordHash'] } });
    if (!user) return res.status(404).json({ status: 'fail', message: 'User not found' });
    res.status(200).json({ status: 'success', data: { user } });
  } catch (err) {
    next(err);
  }
};

// @desc   Update logged‑in user profile
// @route  PATCH /api/users/profile
// @access Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (password) {
      const bcrypt = require('bcryptjs');
      updates.passwordHash = await bcrypt.hash(password, 12);
    }
    const [rows, [updatedUser]] = await User.update(updates, {
      where: { id: req.user.id },
      returning: true,
    });
    res.status(200).json({ status: 'success', data: { user: updatedUser } });
  } catch (err) {
    next(err);
  }
};

// @desc   Delete a user (admin only)
// @route  DELETE /api/users/:id
// @access Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const rows = await User.destroy({ where: { id: userId } });
    if (!rows) return res.status(404).json({ status: 'fail', message: 'User not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
