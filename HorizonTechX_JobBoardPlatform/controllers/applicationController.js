const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const JobListing = require('../models/JobListing');
const Resume = require('../models/Resume');
const Employer = require('../models/Employer');
const Candidate = require('../models/Candidate');
const notify = require('../utils/notify');
const { APPLICATION_STATUS_FLOW } = require('../utils/constants');
const { isJobAcceptingApplications } = require('../utils/jobExpiry');

// Helper to escape HTML tags for simple input sanitization
const sanitizeString = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

const applyToJob = asyncHandler(async (req, res) => {
  const { jobId, resumeId, coverLetter } = req.body;

  if (!jobId) {
    res.status(400);
    throw new Error('jobId is required');
  }

  const candidate = await Candidate.findById(req.user._id);
  if (!candidate) {
    res.status(404);
    throw new Error('Candidate not found');
  }

  const job = await JobListing.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  const employer = await Employer.findById(job.employer);
  if (!employer) {
    res.status(404);
    throw new Error('Employer for this job no longer exists');
  }

  if (!isJobAcceptingApplications(job)) {
    res.status(400);
    throw new Error(
      job.status === 'expired' || (job.closingDate && new Date(job.closingDate) < new Date())
        ? 'Application deadline has passed for this job'
        : 'This job is not currently accepting applications'
    );
  }

  let resume;
  if (resumeId) {
    resume = await Resume.findById(resumeId);
    if (!resume) {
      res.status(404);
      throw new Error('Resume not found');
    }
  } else {
    resume = await Resume.findOne({ candidate: req.user._id, isDefault: true });
  }

  if (!resume) {
    res.status(400);
    throw new Error('No resume found. Upload a resume or provide a resumeId before applying.');
  }
  if (resume.candidate.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You can only apply using your own resume');
  }

  const alreadyApplied = await Application.findOne({ job: jobId, candidate: req.user._id });
  if (alreadyApplied) {
    res.status(409);
    throw new Error('You have already applied to this job');
  }

  // Sanitize cover letter and enforce limits
  let sanitizedCoverLetter = '';
  if (coverLetter) {
    sanitizedCoverLetter = sanitizeString(coverLetter);
    if (sanitizedCoverLetter.length > 3000) {
      res.status(400);
      throw new Error('Cover letter cannot exceed 3000 characters');
    }
  }

  const application = await Application.create({
    job: jobId,
    candidate: req.user._id,
    employer: job.employer,
    resume: resume._id,
    coverLetter: sanitizedCoverLetter,
    status: 'applied',
    statusHistory: [{ status: 'applied', note: 'Application submitted' }],
  });

  job.applicationsCount += 1;
  await job.save();

  // Employer Notification
  await notify({
    recipientType: 'employer',
    recipientId: job.employer,
    type: 'new_application',
    message: `New application received for "${job.title}" from candidate: ${candidate.name}. Experience: ${candidate.experienceYears || 0} years.`,
    relatedJob: job._id,
    relatedApplication: application._id,
  });

  res.status(201).json({ success: true, data: application });
});

const getMyApplications = asyncHandler(async (req, res) => {
  const filter = { candidate: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const applications = await Application.find(filter)
    .sort('-createdAt')
    .populate({ path: 'job', select: 'title location jobType status closingDate', populate: { path: 'employer', select: 'companyName' } })
    .populate('resume', 'originalName filePath createdAt');

  res.json({ success: true, count: applications.length, data: applications });
});

const getApplicationsForJob = asyncHandler(async (req, res) => {
  const job = await JobListing.findById(req.params.jobId);
  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }
  if (job.employer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view applicants for this job');
  }

  const filter = { job: req.params.jobId };
  if (req.query.status) filter.status = req.query.status;

  const applications = await Application.find(filter)
    .sort('-createdAt')
    .populate('candidate', 'name email phone skills experienceYears location')
    .populate('resume', 'originalName filePath fileType createdAt');

  res.json({ success: true, count: applications.length, data: applications });
});

const getEmployerApplications = asyncHandler(async (req, res) => {
  const filter = { employer: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.jobId) filter.job = req.query.jobId;

  const applications = await Application.find(filter)
    .sort('-createdAt')
    .populate('job', 'title location status')
    .populate('candidate', 'name email phone skills experienceYears location')
    .populate('resume', 'originalName filePath fileType createdAt');

  res.json({ success: true, count: applications.length, data: applications });
});

const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('job')
    .populate('candidate', 'name email phone skills experienceYears location')
    .populate('resume', 'originalName filePath fileType createdAt');

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  const isCandidateOwner = application.candidate._id.toString() === req.user._id.toString();
  const isEmployerOwner = application.employer.toString() === req.user._id.toString();
  const isAdmin = req.userRole === 'admin';

  if (!isCandidateOwner && !isEmployerOwner && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view this application');
  }

  res.json({ success: true, data: application });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const application = await Application.findById(req.params.id).populate('job', 'title employer');
  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }
  if (application.employer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this application');
  }

  // Prevent editing application status if it has already been withdrawn
  if (application.status === 'withdrawn') {
    res.status(400);
    throw new Error('Cannot update status of a withdrawn application');
  }

  const allowedNextStatuses = APPLICATION_STATUS_FLOW[application.status] || [];
  if (!allowedNextStatuses.includes(status)) {
    res.status(400);
    throw new Error(
      `Invalid status transition from "${application.status}" to "${status}". Allowed: ${
        allowedNextStatuses.length ? allowedNextStatuses.join(', ') : 'none (terminal state)'
      }`
    );
  }

  application.status = status;
  application.statusHistory.push({ status, note: note || `Status updated to ${status.replace(/_/g, ' ')}` });
  await application.save();

  await notify({
    recipientType: 'candidate',
    recipientId: application.candidate,
    type: 'status_update',
    message: `Your application status for "${application.job.title}" has been updated to: ${status.replace(/_/g, ' ')}`,
    relatedJob: application.job._id,
    relatedApplication: application._id,
  });

  res.json({ success: true, data: application });
});

// @desc   Withdraw application
// @route  PATCH /api/applications/:id/withdraw
// @access Private (candidate owner only)
const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate('job', 'title employer');
  
  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  if (application.candidate.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to withdraw this application');
  }

  const nonTerminalStates = ['applied', 'under_review', 'shortlisted', 'interview_scheduled'];
  if (!nonTerminalStates.includes(application.status)) {
    res.status(400);
    throw new Error(`Cannot withdraw application in its current state: ${application.status}`);
  }

  const previousStatus = application.status;
  application.status = 'withdrawn';
  application.statusHistory.push({
    status: 'withdrawn',
    note: req.body.note || 'Application withdrawn by candidate'
  });
  await application.save();

  // Notify employer
  await notify({
    recipientType: 'employer',
    recipientId: application.employer,
    type: 'application_withdrawn',
    message: `Application for "${application.job.title}" was withdrawn by the candidate. Previous status: ${previousStatus.replace(/_/g, ' ')}.`,
    relatedJob: application.job._id,
    relatedApplication: application._id,
  });

  res.status(200).json({ success: true, message: 'Application withdrawn successfully', data: application });
});

module.exports = {
  applyToJob,
  getMyApplications,
  getApplicationsForJob,
  getEmployerApplications,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication,
};
