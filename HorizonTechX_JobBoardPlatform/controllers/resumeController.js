const asyncHandler = require('express-async-handler');
const fs = require('fs');
const Resume = require('../models/Resume');
const Candidate = require('../models/Candidate');

// @desc    Upload a resume file for the logged-in candidate
// @route   POST /api/resumes/upload
// @access  Private (candidate)
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No resume file was uploaded. Attach a file under the "resume" field.');
  }

  const existingCount = await Resume.countDocuments({ candidate: req.user._id });

  const resume = await Resume.create({
    candidate: req.user._id,
    originalName: req.file.originalname,
    storedFileName: req.file.filename,
    filePath: req.file.path,
    fileType: req.file.mimetype,
    fileSizeBytes: req.file.size,
    isDefault: existingCount === 0, // first uploaded resume becomes the default automatically
  });

  if (existingCount === 0) {
    await Candidate.findByIdAndUpdate(req.user._id, { defaultResume: resume._id });
  }

  res.status(201).json({ success: true, data: resume });
});

// @desc    List all resumes uploaded by the logged-in candidate
// @route   GET /api/resumes/my
// @access  Private (candidate)
const getMyResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ candidate: req.user._id }).sort('-createdAt');
  res.json({ success: true, count: resumes.length, data: resumes });
});

// @desc    Delete a resume (and its file from disk)
// @route   DELETE /api/resumes/:id
// @access  Private (candidate, owner only)
const deleteResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);

  if (!resume) {
    res.status(404);
    throw new Error('Resume not found');
  }
  if (resume.candidate.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this resume');
  }

  // Remove the physical file; ignore error if it's already gone.
  fs.unlink(resume.filePath, () => {});

  await resume.deleteOne();

  // If the deleted resume was the candidate's default, clear/reassign it.
  const candidate = await Candidate.findById(req.user._id);
  if (candidate.defaultResume && candidate.defaultResume.toString() === resume._id.toString()) {
    const nextResume = await Resume.findOne({ candidate: req.user._id }).sort('-createdAt');
    candidate.defaultResume = nextResume ? nextResume._id : null;
    if (nextResume) {
      nextResume.isDefault = true;
      await nextResume.save();
    }
    await candidate.save();
  }

  res.json({ success: true, message: 'Resume deleted successfully' });
});

// @desc    Set a resume as the candidate's default
// @route   PATCH /api/resumes/:id/default
// @access  Private (candidate, owner only)
const setDefaultResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);

  if (!resume) {
    res.status(404);
    throw new Error('Resume not found');
  }
  if (resume.candidate.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to modify this resume');
  }

  await Resume.updateMany({ candidate: req.user._id }, { isDefault: false });
  resume.isDefault = true;
  await resume.save();

  await Candidate.findByIdAndUpdate(req.user._id, { defaultResume: resume._id });

  res.json({ success: true, data: resume });
});

module.exports = { uploadResume, getMyResumes, deleteResume, setDefaultResume };
