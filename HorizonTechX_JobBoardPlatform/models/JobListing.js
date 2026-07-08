const mongoose = require('mongoose');
const { JOB_TYPES, EXPERIENCE_LEVELS, JOB_STATUS } = require('../utils/constants');

const jobListingSchema = new mongoose.Schema(
  {
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    requirements: {
      type: [String],
      default: [],
    },
    skillsRequired: {
      type: [String],
      default: [],
      set: (skills) => skills.map((s) => s.trim().toLowerCase()),
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    isRemote: {
      type: Boolean,
      default: false,
    },
    jobType: {
      type: String,
      enum: JOB_TYPES,
      required: true,
    },
    category: {
      type: String,
      trim: true, // e.g. "Engineering", "Design", "Sales"
    },
    experienceLevel: {
      type: String,
      enum: EXPERIENCE_LEVELS,
      default: 'entry',
    },
    salaryMin: {
      type: Number,
      min: 0,
    },
    salaryMax: {
      type: Number,
      min: 0,
      validate: {
        validator: function validateSalaryRange(value) {
          if (this.salaryMin == null || value == null) return true;
          return value >= this.salaryMin;
        },
        message: 'salaryMax must be greater than or equal to salaryMin',
      },
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: JOB_STATUS,
      default: 'active',
    },
    openings: {
      type: Number,
      default: 1,
      min: 1,
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    closingDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Text index powers keyword search across title/description.
jobListingSchema.index({ title: 'text', description: 'text', skillsRequired: 'text' });
// Compound indexes speed up common filter combinations.
jobListingSchema.index({ location: 1, jobType: 1, status: 1 });
jobListingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('JobListing', jobListingSchema);
