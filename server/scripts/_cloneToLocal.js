#!/usr/bin/env node
/**
 * Clone production Atlas DB → development Atlas DB (same cluster, different database)
 *
 * Uses the MongoDB Node.js driver directly — no mongodump/mongorestore CLI needed.
 *
 * What it does:
 *   For every collection in mukonotalks (prod):
 *     1. Drops the matching collection in mukonotalks_dev
 *     2. Reads all documents from prod in batches
 *     3. Inserts them into dev
 *
 * Both databases are on the same Atlas cluster — production is NEVER written to.
 *
 * Usage (from /server):
 *   node scripts/cloneToLocal.js
 *   npm run clone:dev
 *
 * @module scripts/cloneToLocal
 */

const path    = require('path');
const fs      = require('fs');
const dotenv  = require('dotenv');
const { MongoClient } = require('mongodb');

// ─── Load both env files ─────────────────────────────────────
const serverRoot = path.resolve(__dirname, '..');
const prodEnv = dotenv.parse(fs.readFileSync(path.join(serverRoot, '.env.production')));
const devEnv  = dotenv.parse(fs.readFileSync(path.join(serverRoot, '.env')));

const PROD_URI = prodEnv.MONGO_URI;
const DEV_URI  = devEnv.MONGO_URI;

if (!PROD_URI) { console.error('❌  MONGO_URI missing in .env.production'); process.exit(1); }
if (!DEV_URI)  { console.error('❌  MONGO_URI missing in .env');            process.exit(1); }

// Parse DB names from URIs (works for both Atlas SRV and standard URIs)
const parseDB = (uri) => uri.split('/').pop().split('?')[0];
const PROD_DB = parseDB(PROD_URI) || 'test';
const DEV_DB  = parseDB(DEV_URI)  || 'mukonotalks_dev';

const BATCH_SIZE = 500;
const log = (msg) => console.log(`[clone:dev] ${msg}`);

const run = async () => {
  log(`Connecting to Atlas...`);
  const client = new MongoClient(PROD_URI);   // single client, two db handles
  await client.connect();

  const prodDB = client.db(PROD_DB);
  const devDB  = client.db(DEV_DB);

  const collections = await prodDB.listCollections().toArray();
  if (collections.length === 0) {
    log('⚠️   No collections found in production — nothing to clone.');
    await client.close();
    return;
  }

  log(`Found ${collections.length} collections in "${PROD_DB}"`);
  log(`Target database: "${DEV_DB}"\n`);

  let totalDocs = 0;

  for (const { name } of collections) {
    const src  = prodDB.collection(name);
    const dest = devDB.collection(name);

    const count = await src.countDocuments();
    process.stdout.write(`  ▸ ${name} (${count} docs) ... `);

    // Drop destination collection so we start fresh
    await dest.drop().catch(() => {});   // ignore error if collection doesn't exist yet

    // Copy in batches to avoid memory pressure on large collections
    let inserted = 0;
    const cursor = src.find({});
    let batch = [];

    for await (const doc of cursor) {
      batch.push(doc);
      if (batch.length >= BATCH_SIZE) {
        await dest.insertMany(batch, { ordered: false });
        inserted += batch.length;
        batch = [];
      }
    }
    if (batch.length > 0) {
      await dest.insertMany(batch, { ordered: false });
      inserted += batch.length;
    }

    totalDocs += inserted;
    process.stdout.write(`✅  (${inserted} inserted)\n`);
  }

  await client.close();

  console.log('\n─────────────────────────────────────────────────────');
  console.log('✅  Clone complete');
  console.log(`    Source  : ${PROD_DB}  (${collections.length} collections)`);
  console.log(`    Target  : ${DEV_DB}`);
  console.log(`    Docs    : ${totalDocs}`);
  console.log('─────────────────────────────────────────────────────');
};

run().catch((err) => {
  console.error('❌  Clone failed:', err.message);
  process.exit(1);
});
