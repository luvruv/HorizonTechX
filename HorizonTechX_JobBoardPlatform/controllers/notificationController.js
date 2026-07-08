const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// @desc    Get logged-in user's notifications (with pagination)
// @route   GET /api/notifications/my?page=&limit=&unreadOnly=
// @access  Private (employer or candidate)
const getMyNotifications = asyncHandler(async (req, res) => {
  const filter = { recipient: req.user._id, recipientType: req.userRole };
  if (req.query.unreadOnly === 'true') filter.isRead = false;

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const total = await Notification.countDocuments(filter);
  const notifications = await Notification.find(filter)
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

  res.json({
    success: true,
    count: notifications.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    unreadCount,
    data: notifications,
  });
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

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private (owner only)
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  if (notification.recipient.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this notification');
  }

  await notification.deleteOne();
  res.json({ success: true, message: 'Notification deleted successfully' });
});

module.exports = {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};
