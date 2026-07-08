const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
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
    headline: {
      type: String,
      trim: true,
      maxlength: 150, // e.g. "Full-Stack Developer | React & Node"
    },
    skills: {
      type: [String],
      default: [],
      set: (skills) => skills.map((s) => s.trim().toLowerCase()),
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    education: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    defaultResume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    role: {
      type: String,
      default: 'candidate',
      immutable: true,
    },
  },
  { timestamps: true }
);

candidateSchema.index({ skills: 1 });

candidateSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

candidateSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Candidate', candidateSchema);
