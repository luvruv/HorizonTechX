const asyncHandler = require('express-async-handler');
const JobListing = require('../models/JobListing');
const Application = require('../models/Application');
const ApiFeatures = require('../utils/apiFeatures');

// @desc    Post a new job listing
// @route   POST /api/jobs
// @access  Private (employer)
const createJob = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    requirements,
    skillsRequired,
    location,
    isRemote,
    jobType,
    category,
    experienceLevel,
    salaryMin,
    salaryMax,
    currency,
    openings,
    closingDate,
    status,
  } = req.body;

  if (!title || !description || !location || !jobType) {
    res.status(400);
    throw new Error('title, description, location, and jobType are required');
  }

  const job = await JobListing.create({
    employer: req.user._id,
    title,
    description,
    requirements,
    skillsRequired,
    location,
    isRemote,
    jobType,
    category,
    experienceLevel,
    salaryMin,
    salaryMax,
    currency,
    openings,
    closingDate,
    status: status || 'active',
  });

  res.status(201).json({ success: true, data: job });
});

// @desc    Search & list job listings with filters, keyword search, sort, pagination
// @route   GET /api/jobs
// @query   keyword, location, jobType, category, experienceLevel, skills, salaryMin, salaryMax,
//          isRemote, status, sort, page, limit
// @access  Public
const getJobs = asyncHandler(async (req, res) => {
  // Public search should only ever surface active jobs unless a status is explicitly
  // requested by an authenticated employer viewing their own listings (handled by /employers/:id/jobs).
  const queryString = { status: 'active', ...req.query };

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

// @desc    Get single job listing by id (increments view count)
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = asyncHandler(async (req, res) => {
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

// Helper: ensures the logged-in employer owns the job being modified.
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

// @desc    Update a job listing
// @route   PUT /api/jobs/:id
// @access  Private (employer, owner only)
const updateJob = asyncHandler(async (req, res) => {
  let job;
  try {
    job = await assertOwnership(req.params.id, req.user._id);
  } catch (err) {
    res.status(err.statusCode || 500);
    throw err;
  }

  const allowedFields = [
    'title',
    'description',
    'requirements',
    'skillsRequired',
    'location',
    'isRemote',
    'jobType',
    'category',
    'experienceLevel',
    'salaryMin',
    'salaryMax',
    'currency',
    'openings',
    'closingDate',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) job[field] = req.body[field];
  });

  await job.save();
  res.json({ success: true, data: job });
});

// @desc    Delete a job listing
// @route   DELETE /api/jobs/:id
// @access  Private (employer, owner only)
const deleteJob = asyncHandler(async (req, res) => {
  let job;
  try {
    job = await assertOwnership(req.params.id, req.user._id);
  } catch (err) {
    res.status(err.statusCode || 500);
    throw err;
  }

  await job.deleteOne();
  await Application.deleteMany({ job: job._id });

  res.json({ success: true, message: 'Job listing and its applications have been removed' });
});

// @desc    Toggle job status (active/closed/draft)
// @route   PATCH /api/jobs/:id/status
// @access  Private (employer, owner only)
const updateJobStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['draft', 'active', 'closed'];

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
