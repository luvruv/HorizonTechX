const asyncHandler = require('express-async-handler');
const Employer = require('../models/Employer');
const JobListing = require('../models/JobListing');
const Application = require('../models/Application');

// @desc    Get a single employer's public profile
// @route   GET /api/employers/:id
// @access  Public
const getEmployerById = asyncHandler(async (req, res) => {
  const employer = await Employer.findById(req.params.id);
  if (!employer) {
    res.status(404);
    throw new Error('Employer not found');
  }
  res.json({ success: true, data: employer });
});

// @desc    Update the logged-in employer's own profile
// @route   PUT /api/employers/profile
// @access  Private (employer)
const updateEmployerProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name',
    'companyName',
    'phone',
    'companyWebsite',
    'companyDescription',
    'industry',
    'logoUrl',
    'location',
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

// @desc    List all jobs posted by a specific employer
// @route   GET /api/employers/:id/jobs
// @access  Public
const getEmployerJobs = asyncHandler(async (req, res) => {
  const jobs = await JobListing.find({ employer: req.params.id }).sort('-createdAt');
  res.json({ success: true, count: jobs.length, data: jobs });
});

// @desc    Dashboard summary stats for the logged-in employer
// @route   GET /api/employers/dashboard/stats
// @access  Private (employer)
const getEmployerDashboardStats = asyncHandler(async (req, res) => {
  const employerId = req.user._id;

  const [totalJobs, activeJobs, closedJobs, totalApplications, statusBreakdown] = await Promise.all([
    JobListing.countDocuments({ employer: employerId }),
    JobListing.countDocuments({ employer: employerId, status: 'active' }),
    JobListing.countDocuments({ employer: employerId, status: 'closed' }),
    Application.countDocuments({ employer: employerId }),
    Application.aggregate([
      { $match: { employer: employerId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      totalJobs,
      activeJobs,
      closedJobs,
      totalApplications,
      applicationsByStatus: statusBreakdown.reduce((acc, cur) => {
        acc[cur._id] = cur.count;
        return acc;
      }, {}),
    },
  });
});

module.exports = {
  getEmployerById,
  updateEmployerProfile,
  getEmployerJobs,
  getEmployerDashboardStats,
};
