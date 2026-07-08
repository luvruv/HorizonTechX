/**
 * Seed script - populates the database with demo data so a reviewer
 * (mentor/evaluator) can explore the API immediately without manually
 * registering accounts first.
 *
 * Usage:
 *   npm run seed            -> inserts demo data
 *   npm run seed:destroy    -> wipes all collections
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Employer = require('../models/Employer');
const Candidate = require('../models/Candidate');
const Admin = require('../models/Admin');
const JobListing = require('../models/JobListing');
const Application = require('../models/Application');
const Resume = require('../models/Resume');
const Notification = require('../models/Notification');

const run = async () => {
  await connectDB();

  if (process.argv.includes('--destroy')) {
    await Promise.all([
      Employer.deleteMany(),
      Candidate.deleteMany(),
      Admin.deleteMany(),
      JobListing.deleteMany(),
      Application.deleteMany(),
      Resume.deleteMany(),
      Notification.deleteMany(),
    ]);
    console.log('[Seed] All collections cleared.');
    return mongoose.connection.close();
  }

  // Clear existing demo data to keep seeding idempotent.
  await Promise.all([
    Employer.deleteMany(),
    Candidate.deleteMany(),
    Admin.deleteMany(),
    JobListing.deleteMany(),
    Application.deleteMany(),
    Resume.deleteMany(),
    Notification.deleteMany(),
  ]);

  const admin = await Admin.create({
    name: 'Platform Admin',
    email: process.env.ADMIN_EMAIL || 'admin@horizontechx.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
  });

  const employer1 = await Employer.create({
    name: 'Priya Sharma',
    companyName: 'NimbusTech Solutions',
    email: 'hr@nimbustech.com',
    password: 'Password@123',
    phone: '9876543210',
    companyWebsite: 'https://nimbustech.example.com',
    companyDescription: 'A fast-growing SaaS company building cloud infrastructure tools.',
    industry: 'Information Technology',
    location: 'Gurugram, India',
    isVerified: true,
  });

  const employer2 = await Employer.create({
    name: 'Rohan Mehta',
    companyName: 'GreenLeaf Analytics',
    email: 'careers@greenleaf.com',
    password: 'Password@123',
    phone: '9876500000',
    companyDescription: 'Data analytics consultancy serving retail & FMCG clients.',
    industry: 'Data & Analytics',
    location: 'Bengaluru, India',
    isVerified: false,
  });

  const candidate1 = await Candidate.create({
    name: 'Dhruva Jhanjhari',
    email: 'dhruva.demo@example.com',
    password: 'Password@123',
    phone: '9998887770',
    headline: 'Full-Stack Developer | React, Node.js, MongoDB',
    skills: ['javascript', 'react', 'node.js', 'mongodb', 'express'],
    experienceYears: 1,
    education: 'B.Tech Computer Science Engineering',
    location: 'Gurugram, India',
  });

  const candidate2 = await Candidate.create({
    name: 'Ananya Verma',
    email: 'ananya.demo@example.com',
    password: 'Password@123',
    phone: '9998887771',
    headline: 'Data Analyst | SQL, Python, Power BI',
    skills: ['sql', 'python', 'power bi', 'excel'],
    experienceYears: 2,
    education: 'B.Sc Statistics',
    location: 'Bengaluru, India',
  });

  const job1 = await JobListing.create({
    employer: employer1._id,
    title: 'Backend Developer Intern (Node.js)',
    description:
      'Work on our core API platform. You will build REST endpoints, write MongoDB queries, and collaborate with senior engineers on system design.',
    requirements: ['Familiarity with JavaScript', 'Understanding of REST APIs', 'Basic MongoDB knowledge'],
    skillsRequired: ['node.js', 'express', 'mongodb', 'javascript'],
    location: 'Gurugram, India',
    isRemote: true,
    jobType: 'internship',
    category: 'Engineering',
    experienceLevel: 'entry',
    salaryMin: 15000,
    salaryMax: 25000,
    currency: 'INR',
    status: 'active',
    openings: 3,
  });

  const job2 = await JobListing.create({
    employer: employer1._id,
    title: 'Full-Stack Developer',
    description: 'Own features end-to-end across our React frontend and Node.js backend.',
    requirements: ['2+ years experience', 'React & Node.js proficiency'],
    skillsRequired: ['react', 'node.js', 'mongodb', 'javascript'],
    location: 'Remote',
    isRemote: true,
    jobType: 'full-time',
    category: 'Engineering',
    experienceLevel: 'mid',
    salaryMin: 800000,
    salaryMax: 1400000,
    currency: 'INR',
    status: 'active',
    openings: 1,
  });

  const job3 = await JobListing.create({
    employer: employer2._id,
    title: 'Data Analyst',
    description: 'Analyze retail sales data and build dashboards for client reporting.',
    requirements: ['SQL proficiency', 'Power BI or Tableau experience'],
    skillsRequired: ['sql', 'power bi', 'python'],
    location: 'Bengaluru, India',
    isRemote: false,
    jobType: 'full-time',
    category: 'Data & Analytics',
    experienceLevel: 'mid',
    salaryMin: 600000,
    salaryMax: 900000,
    currency: 'INR',
    status: 'active',
    openings: 2,
  });

  const resume1 = await Resume.create({
    candidate: candidate1._id,
    originalName: 'Dhruva_Jhanjhari_Resume.pdf',
    storedFileName: 'seed-resume-1.pdf',
    filePath: 'uploads/resumes/seed-resume-1.pdf',
    fileType: 'application/pdf',
    fileSizeBytes: 102400,
    isDefault: true,
  });
  candidate1.defaultResume = resume1._id;
  await candidate1.save();

  const application1 = await Application.create({
    job: job1._id,
    candidate: candidate1._id,
    employer: employer1._id,
    resume: resume1._id,
    coverLetter: 'I would love to contribute to your backend platform as an intern.',
    status: 'under_review',
    statusHistory: [
      { status: 'applied', note: 'Application submitted' },
      { status: 'under_review', note: 'Shortlisted for review by HR' },
    ],
  });

  job1.applicationsCount += 1;
  await job1.save();

  await Notification.create([
    {
      recipientType: 'employer',
      recipient: employer1._id,
      recipientModel: 'Employer',
      type: 'new_application',
      message: `New application received for "${job1.title}"`,
      relatedJob: job1._id,
      relatedApplication: application1._id,
    },
    {
      recipientType: 'candidate',
      recipient: candidate1._id,
      recipientModel: 'Candidate',
      type: 'status_update',
      message: `Your application for "${job1.title}" is now: under review`,
      relatedJob: job1._id,
      relatedApplication: application1._id,
    },
  ]);

  console.log('[Seed] Demo data inserted successfully:');
  console.log(`  Admin login      -> ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin@12345'} (role: admin)`);
  console.log(`  Employer login 1 -> ${employer1.email} / Password@123 (role: employer, verified)`);
  console.log(`  Employer login 2 -> ${employer2.email} / Password@123 (role: employer, unverified)`);
  console.log(`  Candidate login 1-> ${candidate1.email} / Password@123 (role: candidate)`);
  console.log(`  Candidate login 2-> ${candidate2.email} / Password@123 (role: candidate)`);
  console.log(`  Jobs created: ${job1.title}, ${job2.title}, ${job3.title}`);

  await mongoose.connection.close();
};

run().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
