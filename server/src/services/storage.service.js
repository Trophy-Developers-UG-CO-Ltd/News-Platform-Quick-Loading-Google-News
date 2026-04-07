/**
 * Storage Service
 * Unified file storage abstraction supporting local disk and Cloudflare R2 (S3-compatible)
 * Set FILE_STORAGE=local | s3 in env to switch backends
 * @module services/storage.service
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { env } = require('../config/env');

// Log active storage backend on first load
console.log(`[storage] FILE_STORAGE=${env.FILE_STORAGE || 'local'}, R2_PUBLIC_URL=${env.R2_PUBLIC_URL || '(not set)'}`);

// ─── R2 / S3 client (lazy-loaded only when needed) ───────────────────────────
let s3Client = null;

const getS3Client = () => {
  if (s3Client) return s3Client;

  const { S3Client } = require('@aws-sdk/client-s3');

  s3Client = new S3Client({
    region: env.AWS_REGION || 'auto',
    endpoint: env.AWS_ENDPOINT,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
    // R2 requires path-style URLs
    forcePathStyle: false,
  });

  return s3Client;
};

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload a file buffer to the configured storage backend.
 * @param {Buffer} buffer   - File data
 * @param {string} key      - Storage key/path, e.g. "hero/image.jpg"
 * @param {string} mimetype - MIME type, e.g. "image/jpeg"
 * @returns {Promise<string>} Public URL of the stored file
 */
const uploadFile = async (buffer, key, mimetype) => {
  if (env.FILE_STORAGE === 's3') {
    return _uploadToR2(buffer, key, mimetype);
  }
  return _saveLocally(buffer, key);
};

const _uploadToR2 = async (buffer, key, mimetype) => {
  const { Upload } = require('@aws-sdk/lib-storage');

  const upload = new Upload({
    client: getS3Client(),
    params: {
      Bucket: env.AWS_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      CacheControl: 'public, max-age=31536000',
    },
  });

  await upload.done();

  const publicUrl = env.R2_PUBLIC_URL
    ? `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`
    : `${env.AWS_ENDPOINT}/${env.AWS_BUCKET_NAME}/${key}`;

  return publicUrl;
};

const _saveLocally = async (buffer, key) => {
  const uploadDir = path.join(__dirname, '../../uploads', path.dirname(key));
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filePath = path.join(__dirname, '../../uploads', key);
  await fs.promises.writeFile(filePath, buffer);
  return `/uploads/${key}`;
};

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete a file from storage.
 * @param {string} key - Storage key, e.g. "hero/image.jpg"
 */
const deleteFile = async (key) => {
  if (!key) return;

  if (env.FILE_STORAGE === 's3') {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    await getS3Client().send(
      new DeleteObjectCommand({ Bucket: env.AWS_BUCKET_NAME, Key: key })
    );
    return;
  }

  const filePath = path.join(__dirname, '../../uploads', key);
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
};

/**
 * Extract the storage key from a URL returned by uploadFile.
 * For local: strips the leading "/uploads/"
 * For R2: strips the public URL prefix
 */
const urlToKey = (url) => {
  if (!url) return null;
  if (url.startsWith('/uploads/')) return url.replace('/uploads/', '');
  if (env.R2_PUBLIC_URL && url.startsWith(env.R2_PUBLIC_URL)) {
    return url.replace(env.R2_PUBLIC_URL.replace(/\/$/, '') + '/', '');
  }
  if (env.AWS_ENDPOINT && url.includes(env.AWS_BUCKET_NAME)) {
    const prefix = `${env.AWS_ENDPOINT}/${env.AWS_BUCKET_NAME}/`;
    if (url.startsWith(prefix)) return url.replace(prefix, '');
  }
  return null;
};

module.exports = { uploadFile, deleteFile, urlToKey };

// MukonoTalks

