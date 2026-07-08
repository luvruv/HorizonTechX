// Central place for enums/constants used across models & controllers.
// Keeping these in one file avoids typos ("Full-time" vs "full-time") across the codebase.

const ROLES = {
  EMPLOYER: 'employer',
  CANDIDATE: 'candidate',
  ADMIN: 'admin',
};

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'remote'];

const EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'lead'];

const JOB_STATUS = ['draft', 'active', 'closed'];

const APPLICATION_STATUS = [
  'applied',
  'under_review',
  'shortlisted',
  'interview_scheduled',
  'rejected',
  'hired',
];

// Defines which status transitions are allowed, so an employer can't
// e.g. move an application straight from "applied" to "hired" without review.
const APPLICATION_STATUS_FLOW = {
  applied: ['under_review', 'rejected'],
  under_review: ['shortlisted', 'rejected'],
  shortlisted: ['interview_scheduled', 'rejected'],
  interview_scheduled: ['hired', 'rejected'],
  rejected: [],
  hired: [],
};

const NOTIFICATION_TYPES = [
  'new_application',
  'status_update',
  'job_posted',
  'account',
];

module.exports = {
  ROLES,
  JOB_TYPES,
  EXPERIENCE_LEVELS,
  JOB_STATUS,
  APPLICATION_STATUS,
  APPLICATION_STATUS_FLOW,
  NOTIFICATION_TYPES,
};
