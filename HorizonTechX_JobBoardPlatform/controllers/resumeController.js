const asyncHandler = require('express-async-handler');
const fs = require('fs');
const Resume = require('../models/Resume');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const notify = require('../utils/notify');

const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No resume file was uploaded. Attach a file under the "resume" field.');
  }

  const maxResumes = Number(process.env.MAX_RESUMES_PER_CANDIDATE) || 5;
  const existingCount = await Resume.countDocuments({ candidate: req.user._id });

  if (existingCount >= maxResumes) {
    // Clean up the uploaded file from disk to prevent orphan storage leaks
    if (req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(400);
    throw new Error(`Resume limit reached. You can upload a maximum of ${maxResumes} resumes. Please delete an existing resume first.`);
  }

  const resume = await Resume.create({
    candidate: req.user._id,
    originalName: req.file.originalname,
    storedFileName: req.file.filename,
    filePath: req.file.path,
    fileType: req.file.mimetype,
    fileSizeBytes: req.file.size,
    isDefault: existingCount === 0,
  });

  if (existingCount === 0) {
    await Candidate.findByIdAndUpdate(req.user._id, { defaultResume: resume._id });
  }

  const candidate = await Candidate.findById(req.user._id);
  const activeApplications = await Application.find({
    candidate: req.user._id,
    status: { $nin: ['rejected', 'hired', 'withdrawn'] },
  }).distinct('employer');

  for (const employerId of activeApplications) {
    await notify({
      recipientType: 'employer',
      recipientId: employerId,
      type: 'resume_uploaded',
      message: `${candidate.name} updated their active resume portfolio (${req.file.originalname})`,
      relatedApplication: null,
    });
  }

  res.status(201).json({ success: true, data: resume });
});

const getMyResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ candidate: req.user._id }).sort('-createdAt');
  res.json({ success: true, count: resumes.length, data: resumes });
});

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

  // Prevent deleting a resume if it is currently tied to an active application
  const activeApplicationCount = await Application.countDocuments({
    resume: resume._id,
    status: { $in: ['applied', 'under_review', 'shortlisted', 'interview_scheduled'] },
  });
  if (activeApplicationCount > 0) {
    res.status(400);
    throw new Error(`Cannot delete this resume as it is linked to ${activeApplicationCount} active job application(s)`);
  }

  // Delete actual file on disk
  fs.unlink(resume.filePath, () => {});

  await resume.deleteOne();

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
