const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    companyWebsite: {
      type: String,
      trim: true,
    },
    companyDescription: {
      type: String,
      maxlength: 2000,
    },
    industry: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false, // toggled by admin - used for reporting/trust signal
    },
    role: {
      type: String,
      default: 'employer',
      immutable: true,
    },
  },
  { timestamps: true }
);

employerSchema.index({ companyName: 'text' });

// Hash password before saving
employerSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

employerSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Employer', employerSchema);
