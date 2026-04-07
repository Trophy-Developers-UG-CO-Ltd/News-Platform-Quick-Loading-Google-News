/**
 * Upload Middleware
 * Multer configured with memory storage so files can be forwarded to R2 or local disk
 * @module middlewares/upload.middleware
 */

'use strict';

const multer = require('multer');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
];
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;   // 10 MB
const MAX_FILE_SIZE  = 50 * 1024 * 1024;   // 50 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024;  // 500 MB

const imageFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'), false);
  }
};

const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, Word, Excel, and CSV files are allowed'), false);
  }
};

const videoFilter = (req, file, cb) => {
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only MP4, WebM, OGG, MOV, and AVI video files are allowed'), false);
  }
};

// Memory storage — buffers are forwarded to storage.service.js
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
});

const uploadFile = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

const uploadVideo = multer({
  storage: multer.memoryStorage(),
  fileFilter: videoFilter,
  limits: { fileSize: MAX_VIDEO_SIZE },
});

module.exports = { upload, uploadFile, uploadVideo };

// MukonoTalks

