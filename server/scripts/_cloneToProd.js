#!/usr/bin/env node
/**
 * Clone live Atlas DB (test) → mukonotalks_prod
 *
 * Uses the MongoDB Node.js driver — no mongodump/mongorestore CLI needed.
 *
 * What it does:
 *   Reads every collection from the current live "test" database and
 *   copies it into "mukonotalks_prod" on the same Atlas cluster.
 *   The destination collection is dropped before each copy (clean slate).
 *
 * After this runs, update .env.production MONGO_URI to point to
 * mukonotalks_prod and restart the production server.
 *
 * Usage (from /server):
 *   node scripts/cloneToProd.js
 *   npm run clone:prod
 *
 * @module scripts/cloneToProd
 */

const path   = require('path');
const fs     = require('fs');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

// ─── Load env ────────────────────────────────────────────────
const serverRoot = path.resolve(__dirname, '..');
const prodEnv = dotenv.parse(fs.readFileSync(path.join(serverRoot, '.env.production')));

const BASE_URI = prodEnv.MONGO_URI;
if (!BASE_URI) { console.error('❌  MONGO_URI missing in .env.production'); process.exit(1); }

// Strip any DB name from the URI so we can address both DBs via the same connection
const baseURI = BASE_URI.replace(/\/[^/?]+(\?|$)/, '/$1');

const SOURCE_DB = 'test';
const TARGET_DB = 'mukonotalks_prod';
const BATCH_SIZE = 500;

const log = (msg) => console.log(`[clone:prod] ${msg}`);

const run = async () => {
  log('Connecting to Atlas...');
  const client = new MongoClient(BASE_URI);
  await client.connect();

  const srcDB  = client.db(SOURCE_DB);
  const destDB = client.db(TARGET_DB);

  const collections = await srcDB.listCollections().toArray();
  if (collections.length === 0) {
    log(`⚠️   No collections found in "${SOURCE_DB}" — nothing to clone.`);
    await client.close();
    return;
  }

  log(`Found ${collections.length} collections in "${SOURCE_DB}"`);
  log(`Target database: "${TARGET_DB}"\n`);

  let totalDocs = 0;

  for (const { name } of collections) {
    const src  = srcDB.collection(name);
    const dest = destDB.collection(name);

    const count = await src.countDocuments();
    process.stdout.write(`  ▸ ${name} (${count} docs) ... `);

    await dest.drop().catch(() => {});  // drop existing, ignore error if absent

    let inserted = 0;
    let batch = [];

    for await (const doc of src.find({})) {
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
  console.log(`    Source : ${SOURCE_DB}  (${collections.length} collections)`);
  console.log(`    Target : ${TARGET_DB}`);
  console.log(`    Docs   : ${totalDocs}`);
  console.log('\n⚠️   Next step:');
  console.log('    Update MONGO_URI in .env.production to:');
  console.log(`    ...mongodb.net/${TARGET_DB}?appName=...`);
  console.log('    Then restart the production server.');
  console.log('─────────────────────────────────────────────────────');
};

run().catch((err) => {
  console.error('❌  Clone failed:', err.message);
  process.exit(1);
});
