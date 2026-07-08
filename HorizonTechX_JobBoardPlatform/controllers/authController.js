const asyncHandler = require('express-async-handler');
const Employer = require('../models/Employer');
const Candidate = require('../models/Candidate');
const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');
const { ROLES } = require('../utils/constants');

// Helper to validate email format
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
};

// Helper to validate password strength
const validatePassword = (password) => {
  if (!password || password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one digit';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    return 'Password must contain at least one special character';
  return null;
};

// @desc    Register a new employer
// @route   POST /api/auth/register/employer
// @access  Public
const registerEmployer = asyncHandler(async (req, res) => {
  const { name, companyName, email, password, phone, companyWebsite, companyDescription, industry, location } = req.body;

  if (!name || !companyName || !email || !password) {
    res.status(400);
    throw new Error('name, companyName, email, and password are required');
  }

  const emailClean = String(email).trim().toLowerCase();
  if (!isValidEmail(emailClean)) {
    res.status(400);
    throw new Error('A valid email address is required');
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    res.status(400);
    throw new Error(passwordError);
  }

  const existing = await Employer.findOne({ email: emailClean });
  if (existing) {
    res.status(400);
    throw new Error('An employer with this email already exists');
  }

  const employer = await Employer.create({
    name: String(name).trim(),
    companyName: String(companyName).trim(),
    email: emailClean,
    password,
    phone: phone ? String(phone).trim() : undefined,
    companyWebsite: companyWebsite ? String(companyWebsite).trim() : undefined,
    companyDescription: companyDescription ? String(companyDescription).trim() : undefined,
    industry: industry ? String(industry).trim() : undefined,
    location: location ? String(location).trim() : undefined,
  });

  res.status(201).json({
    success: true,
    data: {
      _id: employer._id,
      name: employer.name,
      companyName: employer.companyName,
      email: employer.email,
      role: employer.role,
      token: generateToken(employer._id, ROLES.EMPLOYER),
    },
  });
});

// @desc    Register a new candidate
// @route   POST /api/auth/register/candidate
// @access  Public
const registerCandidate = asyncHandler(async (req, res) => {
  const { name, email, password, phone, headline, skills, experienceYears, education, location } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('name, email, and password are required');
  }

  const emailClean = String(email).trim().toLowerCase();
  if (!isValidEmail(emailClean)) {
    res.status(400);
    throw new Error('A valid email address is required');
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    res.status(400);
    throw new Error(passwordError);
  }

  const existing = await Candidate.findOne({ email: emailClean });
  if (existing) {
    res.status(400);
    throw new Error('A candidate with this email already exists');
  }

  const candidate = await Candidate.create({
    name: String(name).trim(),
    email: emailClean,
    password,
    phone: phone ? String(phone).trim() : undefined,
    headline: headline ? String(headline).trim() : undefined,
    skills: skills || [],
    experienceYears: experienceYears || 0,
    education: education ? String(education).trim() : undefined,
    location: location ? String(location).trim() : undefined,
  });

  res.status(201).json({
    success: true,
    data: {
      _id: candidate._id,
      name: candidate.name,
      email: candidate.email,
      role: candidate.role,
      token: generateToken(candidate._id, ROLES.CANDIDATE),
    },
  });
});

// @desc    Login for employer, candidate, or admin (role must be specified)
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    res.status(400);
    throw new Error('email, password, and role are required');
  }

  const MODEL_BY_ROLE = {
    [ROLES.EMPLOYER]: Employer,
    [ROLES.CANDIDATE]: Candidate,
    [ROLES.ADMIN]: Admin,
  };

  const Model = MODEL_BY_ROLE[role];
  if (!Model) {
    res.status(400);
    throw new Error(`Invalid role. Must be one of: ${Object.keys(MODEL_BY_ROLE).join(', ')}`);
  }

  const emailClean = String(email).trim().toLowerCase();
  const user = await Model.findOne({ email: emailClean }).select('+password');
  
  // enumeration protection: return generic invalid message, but check password only if user exists
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password credentials');
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    },
  });
});

// @desc    Get logged-in user's own profile
// @route   GET /api/auth/me
// @access  Private (any role)
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = { registerEmployer, registerCandidate, login, getMe };
