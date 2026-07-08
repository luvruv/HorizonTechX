const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Route modules
const authRoutes = require('./routes/authRoutes');
const employerRoutes = require('./routes/employerRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const jobRoutes = require('./routes/jobRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Connect to MongoDB before the app starts accepting traffic.
connectDB();

const app = express();

// ---- Global middleware ----
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || '*',
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Basic rate limiting to protect auth & write-heavy endpoints from abuse.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

// Serve uploaded resumes statically (for employers to preview/download).
app.use('/uploads/resumes', express.static(path.join(__dirname, 'uploads', 'resumes')));

// ---- Health check ----
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'HorizonTechX Job Board API is running', timestamp: new Date().toISOString() });
});

// ---- Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the HorizonTechX Job Board Platform API',
    docs: 'See README.md for full endpoint documentation and the /postman collection for ready-made requests.',
  });
});

// 404 + centralized error handler (must be registered last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Server] HorizonTechX Job Board API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Guard against unhandled promise rejections crashing the process silently.
process.on('unhandledRejection', (err) => {
  console.error(`[UnhandledRejection] ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
