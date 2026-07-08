// Central place for enums/constants used across models & controllers.

const ROLES = {
  EMPLOYER: 'employer',
  CANDIDATE: 'candidate',
  ADMIN: 'admin',
};

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'remote'];

const EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'lead'];

const JOB_STATUS = ['draft', 'active', 'closed', 'expired'];

// Added 'withdrawn' status for candidates to withdraw applications
const APPLICATION_STATUS = [
  'applied',
  'under_review',
  'shortlisted',
  'interview_scheduled',
  'rejected',
  'hired',
  'withdrawn',
];

const APPLICATION_STATUS_LABELS = {
  applied: 'Applied',
  under_review: 'Review',
  shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview',
  rejected: 'Rejected',
  hired: 'Selected',
  withdrawn: 'Withdrawn',
};

// Flow allowing 'withdrawn' status transition from non-terminal states
const APPLICATION_STATUS_FLOW = {
  applied: ['under_review', 'rejected', 'withdrawn'],
  under_review: ['shortlisted', 'rejected', 'withdrawn'],
  shortlisted: ['interview_scheduled', 'rejected', 'withdrawn'],
  interview_scheduled: ['hired', 'rejected', 'withdrawn'],
  rejected: [],
  hired: [],
  withdrawn: [],
};

const NOTIFICATION_TYPES = [
  'new_application',
  'status_update',
  'resume_uploaded',
  'job_posted',
  'account',
  'application_withdrawn', // added for candidate withdrawal
];

module.exports = {
  ROLES,
  JOB_TYPES,
  EXPERIENCE_LEVELS,
  JOB_STATUS,
  APPLICATION_STATUS,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_FLOW,
  NOTIFICATION_TYPES,
};
