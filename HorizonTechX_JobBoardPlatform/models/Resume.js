const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    storedFileName: {
      type: String,
      required: true, // the name saved on disk (unique, prevents collisions)
    },
    filePath: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true, // mime type, e.g. application/pdf
    },
    fileSizeBytes: {
      type: Number,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

resumeSchema.index({ candidate: 1 });

module.exports = mongoose.model('Resume', resumeSchema);
