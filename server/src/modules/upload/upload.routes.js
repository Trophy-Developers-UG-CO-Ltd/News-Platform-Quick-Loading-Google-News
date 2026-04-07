/**
 * Upload Routes
 * General-purpose image upload endpoint for admin panel
 * @module modules/upload/upload.routes
 */

'use strict';

const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { upload, uploadFile: uploadFileMiddleware } = require('../../middlewares/upload.middleware');
const { uploadFile } = require('../../services/storage.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { env } = require('../../config/env');

/**
 * @route  POST /api/upload/image
 * @desc   Upload an image to local storage or Cloudflare R2
 * @access Admin
 * @body   multipart/form-data — field: "image", optional field: "folder" (default: "uploads")
 */
router.post(
  '/image',
  protect,
  authorize('admin'),
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const folder = (req.body.folder || 'uploads').replace(/[^a-zA-Z0-9_-]/g, '');
    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const key = `${folder}/${uuidv4()}${ext}`;

    const url = await uploadFile(req.file.buffer, key, req.file.mimetype);

    res.status(201).json({ success: true, url, key });
  })
);

/**
 * @route  POST /api/upload/file
 * @desc   Upload a document (PDF, Word, Excel) to local storage or Cloudflare R2
 * @access Admin
 * @body   multipart/form-data — field: "file", optional field: "folder" (default: "documents")
 */
router.post(
  '/file',
  protect,
  authorize('admin'),
  uploadFileMiddleware.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const folder = (req.body.folder || 'documents').replace(/[^a-zA-Z0-9_-]/g, '');
    const ext = path.extname(req.file.originalname).toLowerCase() || '.pdf';
    const key = `${folder}/${uuidv4()}${ext}`;

    const url = await uploadFile(req.file.buffer, key, req.file.mimetype);

    res.status(201).json({
      success: true,
      url,
      key,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  })
);

/**
 * @route  GET /api/upload/video-presign
 * @desc   Generate a presigned PUT URL so the client can upload videos
 *         directly to Cloudflare R2 without routing the bytes through the server.
 *         Falls back to a flag telling the client to use the legacy proxy route
 *         when FILE_STORAGE=local.
 * @access Admin
 * @query  filename   e.g. "product-demo.mp4"
 * @query  contentType e.g. "video/mp4"
 * @query  folder      e.g. "videos" (optional)
 */
const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
]);

router.get(
  '/video-presign',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { filename = 'video.mp4', contentType = 'video/mp4', folder = 'videos' } = req.query;

    if (!ALLOWED_VIDEO_TYPES.has(contentType)) {
      return res.status(400).json({ success: false, message: 'Invalid video content type' });
    }

    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const ext = path.extname(filename).toLowerCase() || '.mp4';
    const key = `${safeFolder}/${uuidv4()}${ext}`;

    const publicUrl = env.R2_PUBLIC_URL
      ? `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`
      : `${env.AWS_ENDPOINT}/${env.AWS_BUCKET_NAME}/${key}`;

    if (env.FILE_STORAGE !== 's3') {
      // Local storage — inform client to fall back to multipart proxy
      return res.json({ success: true, mode: 'proxy', key });
    }

    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

    const s3 = new S3Client({
      region: 'auto',
      endpoint: env.AWS_ENDPOINT,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
      forcePathStyle: false,
    });

    const command = new PutObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour

    res.json({ success: true, mode: 'presign', presignedUrl, publicUrl, key });
  })
);

/**
 * @route  POST /api/upload/video
 * @desc   Proxy video upload — only used when FILE_STORAGE=local.
 *         For R2/s3, clients use the presigned PUT URL instead.
 * @access Admin
 */
const { uploadVideo: uploadVideoMiddleware } = require('../../middlewares/upload.middleware');

router.post(
  '/video',
  protect,
  authorize('admin'),
  uploadVideoMiddleware.single('video'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    const folder = (req.body.folder || 'videos').replace(/[^a-zA-Z0-9_-]/g, '');
    const ext = path.extname(req.file.originalname).toLowerCase() || '.mp4';
    const key = `${folder}/${uuidv4()}${ext}`;

    const url = await uploadFile(req.file.buffer, key, req.file.mimetype);

    res.status(201).json({ success: true, url, key });
  })
);

module.exports = router;

// MukonoTalks

