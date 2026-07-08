const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'resumes');

// Ensure the upload directory exists at startup.
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Maps MIME types to their valid extensions for strict validation
const MIME_EXTENSION_MAP = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Unique name prevents collisions/overwrites between candidates.
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `resume-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = MIME_EXTENSION_MAP[file.mimetype];

  // Cross-validate that both the MIME type is allowed, AND the extension matches that MIME type.
  if (allowedExtensions && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Strict Validation Failed: File extension does not match the MIME content type. Allowed formats: PDF (.pdf), DOC (.doc), DOCX (.docx)'), false);
  }
};

const maxSizeMb = Number(process.env.MAX_RESUME_SIZE_MB) || 5;

const uploadResume = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
});

module.exports = { uploadResume, UPLOAD_DIR };
