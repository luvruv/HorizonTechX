const Notification = require('../models/Notification');

/**
 * Creates an in-app notification for an employer or candidate.
 * This centralizes notification creation so every controller
 * that needs to notify a user goes through the same shape/validation.
 *
 * @param {Object} params
 * @param {'employer'|'candidate'} params.recipientType
 * @param {import('mongoose').Types.ObjectId|string} params.recipientId
 * @param {string} params.type - one of NOTIFICATION_TYPES
 * @param {string} params.message
 * @param {string} [params.relatedJob]
 * @param {string} [params.relatedApplication]
 */
const notify = async ({ recipientType, recipientId, type, message, relatedJob, relatedApplication }) => {
  const recipientModel = recipientType === 'employer' ? 'Employer' : 'Candidate';

  return Notification.create({
    recipientType,
    recipient: recipientId,
    recipientModel,
    type,
    message,
    relatedJob,
    relatedApplication,
  });
};

module.exports = notify;
