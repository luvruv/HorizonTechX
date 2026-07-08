const asyncHandler = require('express-async-handler');
const fs = require('fs');
const Employer = require('../models/Employer');
const Candidate = require('../models/Candidate');
const JobListing = require('../models/JobListing');
const Application = require('../models/Application');
const Resume = require('../models/Resume');
const Notification = require('../models/Notification');

// @desc    Platform-wide overview stats
// @route   GET /api/admin/stats/overview
// @access  Private (admin)
const getOverviewStats = asyncHandler(async (req, res) => {
  const [totalEmployers, verifiedEmployers, totalCandidates, totalJobs, activeJobs, totalApplications] =
    await Promise.all([
      Employer.countDocuments(),
      Employer.countDocuments({ isVerified: true }),
      Candidate.countDocuments(),
      JobListing.countDocuments(),
      JobListing.countDocuments({ status: 'active' }),
      Application.countDocuments(),
    ]);

  res.json({
    success: true,
    data: {
      totalEmployers,
      verifiedEmployers,
      totalCandidates,
      totalJobs,
      activeJobs,
      totalApplications,
    },
  });
});

// @desc    Job counts grouped by category
// @route   GET /api/admin/stats/jobs-by-category
// @access  Private (admin)
const getJobsByCategory = asyncHandler(async (req, res) => {
  const data = await JobListing.aggregate([
    { $group: { _id: { $ifNull: ['$category', 'Uncategorized'] }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, data });
});

// @desc    Application funnel: how many applications sit at each status platform-wide
// @route   GET /api/admin/stats/applications-funnel
// @access  Private (admin)
const getApplicationsFunnel = asyncHandler(async (req, res) => {
  const data = await Application.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, data });
});

// @desc    Top employers by number of jobs posted
// @route   GET /api/admin/stats/top-employers
// @access  Private (admin)
const getTopEmployers = asyncHandler(async (req, res) => {
  const data = await JobListing.aggregate([
    { $group: { _id: '$employer', jobsPosted: { $sum: 1 } } },
    { $sort: { jobsPosted: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'employers',
        localField: '_id',
        foreignField: '_id',
        as: 'employer',
      },
    },
    { $unwind: '$employer' },
    {
      $project: {
        jobsPosted: 1,
        'employer.companyName': 1,
        'employer.email': 1,
        'employer.isVerified': 1,
      },
    },
  ]);
  res.json({ success: true, data });
});

// @desc    List all employers (with pagination)
// @route   GET /api/admin/employers
// @access  Private (admin)
const listEmployers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const [employers, total] = await Promise.all([
    Employer.find()
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Employer.countDocuments(),
  ]);

  res.json({ success: true, page, pages: Math.ceil(total / limit), total, data: employers });
});

// @desc    List all candidates (with pagination)
// @route   GET /api/admin/candidates
// @access  Private (admin)
const listCandidates = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const [candidates, total] = await Promise.all([
    Candidate.find()
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Candidate.countDocuments(),
  ]);

  res.json({ success: true, page, pages: Math.ceil(total / limit), total, data: candidates });
});

// @desc    Verify (or unverify) an employer account
// @route   PATCH /api/admin/employers/:id/verify
// @access  Private (admin)
const setEmployerVerification = asyncHandler(async (req, res) => {
  const { isVerified } = req.body;

  const employer = await Employer.findByIdAndUpdate(
    req.params.id,
    { isVerified: Boolean(isVerified) },
    { new: true }
  );

  if (!employer) {
    res.status(404);
    throw new Error('Employer not found');
  }

  res.json({ success: true, data: employer });
});

// @desc    Admin removes any job listing (moderation)
// @route   DELETE /api/admin/jobs/:id
// @access  Private (admin)
const adminDeleteJob = asyncHandler(async (req, res) => {
  const job = await JobListing.findById(req.params.id);
  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  await job.deleteOne();
  await Application.deleteMany({ job: job._id });

  res.json({ success: true, message: 'Job listing removed by admin' });
});

// @desc    List all jobs platform-wide (moderation)
// @route   GET /api/admin/jobs
// @access  Private (admin)
const listJobs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  const [jobs, total] = await Promise.all([
    JobListing.find()
      .populate('employer', 'companyName email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    JobListing.countDocuments(),
  ]);

  res.json({ success: true, page, pages: Math.ceil(total / limit), total, data: jobs });
});

// @desc    Delete a candidate account along with all their applications, resumes, and physical files
// @route   DELETE /api/admin/candidates/:id
// @access  Private (admin)
const deleteCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) {
    res.status(404);
    throw new Error('Candidate not found');
  }

  // 1. Delete physical resume files from disk
  const resumes = await Resume.find({ candidate: candidate._id });
  for (const resume of resumes) {
    if (resume.filePath && fs.existsSync(resume.filePath)) {
      try {
        fs.unlinkSync(resume.filePath);
      } catch (err) {
        console.error(`Failed to delete resume file: ${resume.filePath}`, err);
      }
    }
  }

  // 2. Delete resumes from database
  await Resume.deleteMany({ candidate: candidate._id });

  // 3. Delete all candidate applications
  await Application.deleteMany({ candidate: candidate._id });

  // 4. Delete candidate notifications
  await Notification.deleteMany({ recipient: candidate._id, recipientModel: 'Candidate' });

  // 5. Delete candidate account
  await candidate.deleteOne();

  res.json({ success: true, message: 'Candidate account and associated resumes, applications, and files deleted successfully' });
});

// @desc    Delete an employer account and all their jobs and applications
// @route   DELETE /api/admin/employers/:id
// @access  Private (admin)
const deleteEmployer = asyncHandler(async (req, res) => {
  const employer = await Employer.findById(req.params.id);
  if (!employer) {
    res.status(404);
    throw new Error('Employer not found');
  }

  // 1. Find all jobs posted by the employer
  const jobs = await JobListing.find({ employer: employer._id });
  const jobIds = jobs.map((j) => j._id);

  // 2. Delete all applications related to these jobs
  await Application.deleteMany({ job: { $in: jobIds } });

  // 3. Delete all job listings
  await JobListing.deleteMany({ employer: employer._id });

  // 4. Delete employer notifications
  await Notification.deleteMany({ recipient: employer._id, recipientModel: 'Employer' });

  // 5. Delete employer account
  await employer.deleteOne();

  res.json({ success: true, message: 'Employer account and all their posted jobs and applications deleted successfully' });
});

module.exports = {
  getOverviewStats,
  getJobsByCategory,
  getApplicationsFunnel,
  getTopEmployers,
  listEmployers,
  listCandidates,
  setEmployerVerification,
  adminDeleteJob,
  listJobs,
  deleteCandidate,
  deleteEmployer,
};
