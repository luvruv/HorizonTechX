const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/my', protect, authorize('employer', 'candidate'), getMyNotifications);
router.patch('/read-all', protect, authorize('employer', 'candidate'), markAllNotificationsRead);
router.patch('/:id/read', protect, authorize('employer', 'candidate'), markNotificationRead);

module.exports = router;
