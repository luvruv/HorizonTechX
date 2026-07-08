const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// @desc    Get logged-in user's notifications
// @route   GET /api/notifications/my
// @access  Private (employer or candidate)
const getMyNotifications = asyncHandler(async (req, res) => {
  const filter = { recipient: req.user._id, recipientType: req.userRole };
  if (req.query.unreadOnly === 'true') filter.isRead = false;

  const notifications = await Notification.find(filter).sort('-createdAt').limit(50);
  const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

  res.json({ success: true, count: notifications.length, unreadCount, data: notifications });
});

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private (owner only)
const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  if (notification.recipient.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to modify this notification');
  }

  notification.isRead = true;
  await notification.save();

  res.json({ success: true, data: notification });
});

// @desc    Mark all of the logged-in user's notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, recipientType: req.userRole, isRead: false },
    { isRead: true }
  );
  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = { getMyNotifications, markNotificationRead, markAllNotificationsRead };
