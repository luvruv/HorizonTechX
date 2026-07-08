const asyncHandler = require('express-async-handler');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const Resume = require('../models/Resume');
const { APPLICATION_STATUS_LABELS } = require('../utils/constants');

const getCandidateById = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) {
    res.status(404);
    throw new Error('Candidate not found');
  }
  res.json({ success: true, data: candidate });
});

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

const getCandidateDashboard = asyncHandler(async (req, res) => {
  const candidateId = req.user._id;

  const [totalApplications, statusBreakdown, recentApplications, resumes, applications] = await Promise.all([
    Application.countDocuments({ candidate: candidateId }),
    Application.aggregate([
      { $match: { candidate: candidateId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.find({ candidate: candidateId })
      .sort('-createdAt')
      .limit(5)
      .populate({ path: 'job', select: 'title location jobType status', populate: { path: 'employer', select: 'companyName' } }),
    Resume.find({ candidate: candidateId }).sort('-createdAt'),
    Application.find({ candidate: candidateId })
      .sort('-createdAt')
      .populate({ path: 'job', select: 'title location status', populate: { path: 'employer', select: 'companyName' } })
      .populate('resume', 'originalName filePath createdAt'),
  ]);

  const statusMap = statusBreakdown.reduce((acc, cur) => {
    acc[cur._id] = cur.count;
    acc[APPLICATION_STATUS_LABELS[cur._id] || cur._id] = cur.count;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      totalApplications,
      applicationsByStatus: statusMap,
      recentApplications,
      appliedJobs: applications,
      resumes,
      defaultResume: resumes.find((r) => r.isDefault) || resumes[0] || null,
    },
  });
});

module.exports = { getCandidateById, updateCandidateProfile, getCandidateDashboard };
