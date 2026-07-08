const asyncHandler = require('express-async-handler');
const JobListing = require('../models/JobListing');
const Application = require('../models/Application');
const Employer = require('../models/Employer');
const Candidate = require('../models/Candidate');
const ApiFeatures = require('../utils/apiFeatures');
const notify = require('../utils/notify');
const { expirePastDueJobs } = require('../utils/jobExpiry');

const createJob = asyncHandler(async (req, res) => {
  const {
    title, description, requirements, skillsRequired, location, isRemote,
    jobType, category, experienceLevel, salaryMin, salaryMax, currency,
    openings, closingDate, status,
  } = req.body;

  if (!title || !description || !location || !jobType) {
    res.status(400);
    throw new Error('title, description, location, and jobType are required');
  }

  // Set closing date default to 30 days from now if not provided
  const closing = closingDate ? new Date(closingDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  if (isNaN(closing.getTime())) {
    res.status(400);
    throw new Error('Invalid closing date format');
  }
  if (closing <= new Date()) {
    res.status(400);
    throw new Error('Closing date must be in the future');
  }

  const job = await JobListing.create({
    employer: req.user._id,
    title, description, requirements, skillsRequired, location, isRemote,
    jobType, category, experienceLevel, salaryMin, salaryMax, currency,
    openings: openings || 1,
    closingDate: closing,
    status: status || 'active',
  });

  // Query employer details to get companyName for notification message
  const employer = await Employer.findById(req.user._id);
  const companyName = employer ? employer.companyName : 'An employer';

  // Notify candidates who have matching skills
  if (job.status === 'active' && job.skillsRequired && job.skillsRequired.length > 0) {
    const matchingCandidates = await Candidate.find({
      skills: { $in: job.skillsRequired },
    });

    for (const cand of matchingCandidates) {
      await notify({
        recipientType: 'candidate',
        recipientId: cand._id,
        type: 'job_posted',
        message: `New job alert: "${job.title}" matching your skills has been posted by ${companyName}.`,
        relatedJob: job._id,
      });
    }
  }

  res.status(201).json({ success: true, data: job });
});

const getJobs = asyncHandler(async (req, res) => {
  await expirePastDueJobs();

  const queryString = { status: 'active', ...req.query };

  if (queryString.company) {
    const employers = await Employer.find({
      companyName: { $regex: queryString.company, $options: 'i' },
    }).select('_id');
    queryString.employer = { $in: employers.map((e) => e._id) };
    delete queryString.company;
  }

  const totalCountFeatures = new ApiFeatures(JobListing.find(), queryString).search().filter();
  const total = await JobListing.countDocuments(totalCountFeatures.query.getFilter());

  const features = new ApiFeatures(JobListing.find(), queryString).search().filter().sort().paginate();
  const jobs = await features.query.populate('employer', 'companyName logoUrl location isVerified');

  res.json({
    success: true,
    count: jobs.length,
    total,
    page: features.pagination.page,
    pages: Math.ceil(total / features.pagination.limit),
    data: jobs,
  });
});

const getJobById = asyncHandler(async (req, res) => {
  await expirePastDueJobs();

  const job = await JobListing.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate('employer', 'companyName logoUrl location isVerified companyDescription companyWebsite');

  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  res.json({ success: true, data: job });
});

const assertOwnership = async (jobId, employerId) => {
  const job = await JobListing.findById(jobId);
  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }
  if (job.employer.toString() !== employerId.toString()) {
    const error = new Error('Not authorized to modify this job listing');
    error.statusCode = 403;
    throw error;
  }
  return job;
};

const updateJob = asyncHandler(async (req, res) => {
  let job;
  try {
    job = await assertOwnership(req.params.id, req.user._id);
  } catch (err) {
    res.status(err.statusCode || 500);
    throw err;
  }

  // Strictly filter out 'status' field updates (status has its own dedicated patch route)
  const allowedFields = [
    'title', 'description', 'requirements', 'skillsRequired', 'location',
    'isRemote', 'jobType', 'category', 'experienceLevel', 'salaryMin',
    'salaryMax', 'currency', 'openings', 'closingDate',
  ];

  if (req.body.status !== undefined) {
    res.status(400);
    throw new Error('Cannot update job status via this endpoint. Please use the /status PATCH endpoint.');
  }

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) job[field] = req.body[field];
  });

  await job.save();
  res.json({ success: true, data: job });
});

const deleteJob = asyncHandler(async (req, res) => {
  let job;
  try {
    job = await assertOwnership(req.params.id, req.user._id);
  } catch (err) {
    res.status(err.statusCode || 500);
    throw err;
  }

  // Notify all affected candidates with active applications before deletion
  const activeApplications = await Application.find({
    job: job._id,
    status: { $in: ['applied', 'under_review', 'shortlisted', 'interview_scheduled'] },
  });

  for (const app of activeApplications) {
    await notify({
      recipientType: 'candidate',
      recipientId: app.candidate,
      type: 'status_update',
      message: `The job listing for "${job.title}" has been deleted or closed by the employer. Your application has been archived.`,
      relatedJob: null,
      relatedApplication: null,
    });
  }

  await job.deleteOne();
  await Application.deleteMany({ job: job._id });

  res.json({ success: true, message: 'Job listing and its applications have been removed' });
});

const updateJobStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['draft', 'active', 'closed', 'expired'];

  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`status must be one of: ${validStatuses.join(', ')}`);
  }

  let job;
  try {
    job = await assertOwnership(req.params.id, req.user._id);
  } catch (err) {
    res.status(err.statusCode || 500);
    throw err;
  }

  job.status = status;
  await job.save();

  res.json({ success: true, data: job });
});

module.exports = { createJob, getJobs, getJobById, updateJob, deleteJob, updateJobStatus };
