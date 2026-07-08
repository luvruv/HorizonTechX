const asyncHandler = require('express-async-handler');
const Employer = require('../models/Employer');
const JobListing = require('../models/JobListing');
const Application = require('../models/Application');
const Candidate = require('../models/Candidate');

const getEmployerById = asyncHandler(async (req, res) => {
  const employer = await Employer.findById(req.params.id);
  if (!employer) {
    res.status(404);
    throw new Error('Employer not found');
  }
  res.json({ success: true, data: employer });
});

const updateEmployerProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name', 'companyName', 'phone', 'companyWebsite',
    'companyDescription', 'industry', 'logoUrl', 'location',
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const employer = await Employer.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: employer });
});

const getEmployerJobs = asyncHandler(async (req, res) => {
  const jobs = await JobListing.find({ employer: req.params.id }).sort('-createdAt');
  res.json({ success: true, count: jobs.length, data: jobs });
});

const getEmployerDashboardStats = asyncHandler(async (req, res) => {
  const employerId = req.user._id;

  const [totalJobs, activeJobs, closedJobs, expiredJobs, totalApplications, statusBreakdown, recentApplications, jobs] =
    await Promise.all([
      JobListing.countDocuments({ employer: employerId }),
      JobListing.countDocuments({ employer: employerId, status: 'active' }),
      JobListing.countDocuments({ employer: employerId, status: 'closed' }),
      JobListing.countDocuments({ employer: employerId, status: 'expired' }),
      Application.countDocuments({ employer: employerId }),
      Application.aggregate([
        { $match: { employer: employerId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Application.find({ employer: employerId })
        .sort('-createdAt')
        .limit(5)
        .populate('candidate', 'name email skills experienceYears')
        .populate('job', 'title')
        .populate('resume', 'originalName'),
      JobListing.find({ employer: employerId }).sort('-createdAt').limit(10),
    ]);

  res.json({
    success: true,
    data: {
      totalJobs,
      activeJobs,
      closedJobs,
      expiredJobs,
      totalApplications,
      applicationsByStatus: statusBreakdown.reduce((acc, cur) => {
        acc[cur._id] = cur.count;
        return acc;
      }, {}),
      recentApplications,
      jobsPosted: jobs,
    },
  });
});

const getEmployerDashboard = asyncHandler(async (req, res) => {
  const employerId = req.user._id;

  const [jobs, applications, candidateIds] = await Promise.all([
    JobListing.find({ employer: employerId }).sort('-createdAt'),
    Application.find({ employer: employerId })
      .sort('-createdAt')
      .populate('candidate', 'name email phone skills experienceYears location')
      .populate('job', 'title location status')
      .populate('resume', 'originalName filePath createdAt'),
    Application.distinct('candidate', { employer: employerId }),
  ]);

  const candidates = await Candidate.find({ _id: { $in: candidateIds } })
    .select('name email skills experienceYears location');

  res.json({
    success: true,
    data: {
      jobsPosted: jobs,
      applications,
      candidates,
      summary: {
        totalJobs: jobs.length,
        activeJobs: jobs.filter((j) => j.status === 'active').length,
        totalApplications: applications.length,
        totalCandidates: candidates.length,
      },
    },
  });
});

module.exports = {
  getEmployerById,
  updateEmployerProfile,
  getEmployerJobs,
  getEmployerDashboardStats,
  getEmployerDashboard,
};
