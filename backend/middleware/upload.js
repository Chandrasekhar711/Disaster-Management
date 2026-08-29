import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
const incidentMediaDir = path.join(uploadsDir, 'incidents');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(incidentMediaDir)) {
  fs.mkdirSync(incidentMediaDir, { recursive: true });
}

// Configure storage for incident media
const incidentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, incidentMediaDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `incident-${uniqueSuffix}${ext}`);
  },
});

// Configure storage for camera captures (stored in memory for AI processing)
const memoryStorage = multer.memoryStorage();

// File filter for images and videos
const mediaFileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only images and videos are allowed.`), false);
  }
};

// File filter for images only (for camera capture AI verification)
const imageOnlyFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only images are allowed for camera capture.`), false);
  }
};

// Multer instance for regular file uploads (stored on disk)
export const uploadMedia = multer({
  storage: incidentStorage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 5, // Maximum 5 files per upload
  },
});

// Multer instance for camera captures (stored in memory for AI processing)
export const uploadCameraCapture = multer({
  storage: memoryStorage,
  fileFilter: imageOnlyFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for camera captures
    files: 1, // Only 1 file for camera capture
  },
});

// Error handling middleware for multer errors
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB for uploads and 10MB for camera captures.',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed per upload.',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field in file upload.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Error processing file upload.',
    });
  }
  
  next();
};

// Helper function to get the URL path for an uploaded file
export const getMediaUrl = (filename) => {
  return `/uploads/incidents/${filename}`;
};

// Helper function to delete a file
export const deleteMediaFile = (filename) => {
  const filePath = path.join(incidentMediaDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

export default {
  uploadMedia,
  uploadCameraCapture,
  handleMulterError,
  getMediaUrl,
  deleteMediaFile,
};
