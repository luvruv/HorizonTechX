const mongoose = require('mongoose');
const { NOTIFICATION_TYPES, ROLES } = require('../utils/constants');

// In-app notification system. Simulates employer/candidate notifications
// (e.g. "new application received", "your application status changed")
// without requiring an external email service - keeps the project self-contained.
const notificationSchema = new mongoose.Schema(
  {
    recipientType: {
      type: String,
      enum: [ROLES.EMPLOYER, ROLES.CANDIDATE],
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'recipientModel',
    },
    recipientModel: {
      type: String,
      required: true,
      enum: ['Employer', 'Candidate'],
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobListing',
    },
    relatedApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
