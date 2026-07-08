const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const JobListing = require('../models/JobListing');
const Resume = require('../models/Resume');
const notify = require('../utils/notify');
const { APPLICATION_STATUS_FLOW } = require('../utils/constants');

// @desc    Apply for a job
// @route   POST /api/applications
// @body    { jobId, resumeId, coverLetter }
// @access  Private (candidate)
const applyToJob = asyncHandler(async (req, res) => {
  const { jobId, resumeId, coverLetter } = req.body;

  if (!jobId) {
    res.status(400);
    throw new Error('jobId is required');
  }

  const job = await JobListing.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }
  if (job.status !== 'active') {
    res.status(400);
    throw new Error('This job is not currently accepting applications');
  }

  // Resolve which resume to attach: explicit resumeId, or the candidate's default.
  let resume;
  if (resumeId) {
    resume = await Resume.findById(resumeId);
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
    res.status(400);
    throw new Error('You have already applied to this job');
  }

  const application = await Application.create({
    job: jobId,
    candidate: req.user._id,
    employer: job.employer,
    resume: resume._id,
    coverLetter,
    status: 'applied',
    statusHistory: [{ status: 'applied', note: 'Application submitted' }],
  });

  // Bump the denormalized counter used for quick dashboard stats.
  job.applicationsCount += 1;
  await job.save();

  // Notify the employer that a new application has come in.
  await notify({
    recipientType: 'employer',
    recipientId: job.employer,
    type: 'new_application',
    message: `New application received for "${job.title}"`,
    relatedJob: job._id,
    relatedApplication: application._id,
  });

  res.status(201).json({ success: true, data: application });
});

// @desc    Get the logged-in candidate's own applications (tracking)
// @route   GET /api/applications/my
// @access  Private (candidate)
const getMyApplications = asyncHandler(async (req, res) => {
  const filter = { candidate: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const applications = await Application.find(filter)
    .sort('-createdAt')
    .populate('job', 'title location jobType status')
    .populate('resume', 'originalName');

  res.json({ success: true, count: applications.length, data: applications });
});

// @desc    Get all applications for a specific job (employer's view of applicants)
// @route   GET /api/applications/job/:jobId
// @access  Private (employer, job owner only)
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
    .populate('resume', 'originalName filePath fileType');

  res.json({ success: true, count: applications.length, data: applications });
});

// @desc    Get a single application (candidate owner or employer owner can view)
// @route   GET /api/applications/:id
// @access  Private
const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('job')
    .populate('candidate', 'name email phone skills experienceYears location')
    .populate('resume', 'originalName filePath fileType');

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  const isCandidateOwner = application.candidate._id.toString() === req.user._id.toString();
  const isEmployerOwner = application.employer.toString() === req.user._id.toString();

  if (!isCandidateOwner && !isEmployerOwner) {
    res.status(403);
    throw new Error('Not authorized to view this application');
  }

  res.json({ success: true, data: application });
});

// @desc    Update an application's status (drives the hiring funnel)
// @route   PATCH /api/applications/:id/status
// @body    { status, note }
// @access  Private (employer, job owner only)
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
  application.statusHistory.push({ status, note });
  await application.save();

  // Notify the candidate their application status has changed.
  await notify({
    recipientType: 'candidate',
    recipientId: application.candidate,
    type: 'status_update',
    message: `Your application for "${application.job.title}" is now: ${status.replace('_', ' ')}`,
    relatedJob: application.job._id,
    relatedApplication: application._id,
  });

  res.json({ success: true, data: application });
});

module.exports = {
  applyToJob,
  getMyApplications,
  getApplicationsForJob,
  getApplicationById,
  updateApplicationStatus,
};
