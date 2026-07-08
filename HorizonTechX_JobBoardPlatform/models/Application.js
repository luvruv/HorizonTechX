const mongoose = require('mongoose');
const { APPLICATION_STATUS } = require('../utils/constants');

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobListing',
      required: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    employer: {
      // denormalized for fast "all applications across my jobs" queries
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      required: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
    },
    coverLetter: {
      type: String,
      maxlength: 3000,
    },
    status: {
      type: String,
      enum: APPLICATION_STATUS,
      default: 'applied',
    },
    statusHistory: [
      {
        status: { type: String, enum: APPLICATION_STATUS },
        note: { type: String },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// A candidate can only apply once per job.
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
applicationSchema.index({ employer: 1, status: 1 });
applicationSchema.index({ candidate: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
