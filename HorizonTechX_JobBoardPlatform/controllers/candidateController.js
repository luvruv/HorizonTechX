const asyncHandler = require('express-async-handler');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');

// @desc    Get a candidate's profile (limited fields if viewed by others)
// @route   GET /api/candidates/:id
// @access  Private (candidate self, or employer - useful when reviewing an applicant)
const getCandidateById = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) {
    res.status(404);
    throw new Error('Candidate not found');
  }
  res.json({ success: true, data: candidate });
});

// @desc    Update the logged-in candidate's own profile
// @route   PUT /api/candidates/profile
// @access  Private (candidate)
const updateCandidateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone', 'headline', 'skills', 'experienceYears', 'education', 'location'];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const candidate = await Candidate.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: candidate });
});

// @desc    Dashboard summary of the logged-in candidate's applications
// @route   GET /api/candidates/dashboard/applications
// @access  Private (candidate)
const getCandidateDashboard = asyncHandler(async (req, res) => {
  const candidateId = req.user._id;

  const [totalApplications, statusBreakdown, recentApplications] = await Promise.all([
    Application.countDocuments({ candidate: candidateId }),
    Application.aggregate([
      { $match: { candidate: candidateId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.find({ candidate: candidateId })
      .sort('-createdAt')
      .limit(5)
      .populate('job', 'title companyName location'),
  ]);

  res.json({
    success: true,
    data: {
      totalApplications,
      applicationsByStatus: statusBreakdown.reduce((acc, cur) => {
        acc[cur._id] = cur.count;
        return acc;
      }, {}),
      recentApplications,
    },
  });
});

module.exports = { getCandidateById, updateCandidateProfile, getCandidateDashboard };
