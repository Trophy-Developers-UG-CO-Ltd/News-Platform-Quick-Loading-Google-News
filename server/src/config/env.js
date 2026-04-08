/**
 * Environment configuration loader
 * Centralizes all environment variable access with validation
 * @module config/env
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load env files from workspace root and server directory.
// Server-level values win over root-level values to preserve local service overrides.
const baseDir = path.resolve(__dirname, '../../');
const workspaceRoot = path.resolve(baseDir, '..');

const loadEnvFile = (candidate, override = false) => {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate, override });
  }
};

// Base env files: server overrides workspace root.
loadEnvFile(path.join(workspaceRoot, '.env'));
loadEnvFile(path.join(baseDir, '.env'), true);

// Production env files: production overrides base, server production wins last.
if (process.env.NODE_ENV === 'production') {
  loadEnvFile(path.join(workspaceRoot, '.env.production'), true);
  loadEnvFile(path.join(baseDir, '.env.production'), true);
}

const env = {
  // App
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,

  // Database
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/mukonotalks',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_COOKIE_EXPIRE: parseInt(process.env.JWT_COOKIE_EXPIRE, 10) || 7,

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  // CORS
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  // File Storage
  FILE_STORAGE: process.env.FILE_STORAGE || 'local',
  // Cloudflare R2
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  AWS_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  AWS_BUCKET_NAME: process.env.R2_BUCKET_NAME,
  AWS_REGION: 'auto',
  AWS_ENDPOINT: process.env.R2_ENDPOINT,
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,

  // Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  FROM_EMAIL: process.env.FROM_EMAIL || process.env.SMTP_USER || 'info@mukonotalks.ug',
  FROM_NAME: process.env.FROM_NAME || 'MukonoTalks',
  CONTACT_EMAIL: process.env.CONTACT_EMAIL || process.env.SALES_EMAIL || '',
  SALES_EMAIL: process.env.SALES_EMAIL || '',

  // Advertise inquiry notifications
  ADVERTISE_INQUIRY_WEBHOOK_URL: process.env.ADVERTISE_INQUIRY_WEBHOOK_URL || '',
  ADVERTISE_INQUIRY_WEBHOOK_TOKEN: process.env.ADVERTISE_INQUIRY_WEBHOOK_TOKEN || '',
  ADVERTISE_INQUIRY_NOTIFICATION_PHONE: process.env.ADVERTISE_INQUIRY_NOTIFICATION_PHONE || '',

  // Database Pool
  MONGO_POOL_SIZE: parseInt(process.env.MONGO_POOL_SIZE, 10) || 100,
  MONGO_MIN_POOL: parseInt(process.env.MONGO_MIN_POOL, 10) || 5,
  MONGO_SERVER_SELECTION_TIMEOUT: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT, 10) || 10000,

  // Google Cloud Translation API
  GOOGLE_TRANSLATE_API_KEY: process.env.GOOGLE_TRANSLATE_API_KEY || '',

  // AI (LLM) Translation Provider
  TRANSLATION_PROVIDER: (process.env.TRANSLATION_PROVIDER || 'google').toLowerCase(),
  AI_TRANSLATION_API_KEY: process.env.AI_TRANSLATION_API_KEY || '',
  AI_TRANSLATION_MODEL: process.env.AI_TRANSLATION_MODEL || 'gpt-4o-mini',
  AI_TRANSLATION_BASE_URL: process.env.AI_TRANSLATION_BASE_URL || 'https://api.openai.com/v1',

  // Redis (for cache & rate limiting at scale)
  REDIS_URL: process.env.REDIS_URL || '',

  // Cluster
  CLUSTER_WORKERS: parseInt(process.env.CLUSTER_WORKERS, 10) || 0, // 0 = auto (os.cpus)

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Cache
  CACHE_MAX_SIZE: parseInt(process.env.CACHE_MAX_SIZE, 10) || 5000,

  // Business Config
  REQUIRE_LOGIN_FOR_PRICING: process.env.REQUIRE_LOGIN_FOR_PRICING === 'true',
  REQUIRE_APPROVAL_FOR_B2B: process.env.REQUIRE_APPROVAL_FOR_B2B === 'true',
  PAYMENT_MODE: process.env.PAYMENT_MODE || 'stripe',

    // Queue / Background jobs
    // Set ENABLE_QUEUE=false to prevent BullMQ from connecting to Redis entirely.
    // Translations will still run in-process (fire-and-forget) when this is false.
    ENABLE_QUEUE: process.env.ENABLE_QUEUE !== 'false',
};

/**
 * Validate critical environment variables on startup
 */
const validateEnv = () => {
  const required = ['JWT_SECRET'];

  if (env.NODE_ENV === 'production') {
    required.push('STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'MONGO_URI');
  }

  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
};

module.exports = { env, validateEnv };

// MukonoTalks

