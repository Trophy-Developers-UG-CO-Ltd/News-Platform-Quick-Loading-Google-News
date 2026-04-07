/**
 * Set Cloudflare R2 bucket CORS policy to allow presigned PUT uploads
 * from the admin client.
 *
 * Run once:  node scripts/setR2Cors.js
 */
'use strict';

const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
});

const BUCKET = process.env.R2_BUCKET_NAME;

const corsConfig = {
  CORSRules: [
    {
      // Allow presigned PUT uploads from any admin origin (restrict in production if needed)
      AllowedOrigins: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD', 'DELETE'],
      AllowedHeaders: ['*'],
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3600,
    },
  ],
};

async function run() {
  console.log(`Setting CORS on bucket: ${BUCKET}`);
  await s3.send(new PutBucketCorsCommand({ Bucket: BUCKET, CORSConfiguration: corsConfig }));
  console.log('CORS policy applied.');

  const { CORSRules } = await s3.send(new GetBucketCorsCommand({ Bucket: BUCKET }));
  console.log('Current CORS rules:', JSON.stringify(CORSRules, null, 2));
}

run().catch((err) => {
  console.error('Failed to set CORS:', err.message);
  process.exit(1);
});

// MukonoTalks

