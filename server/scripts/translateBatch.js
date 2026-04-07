#!/usr/bin/env node
/**
 * Batch Translation Script
 * =========================
 * Scans existing MongoDB CMS documents for missing Swahili (sw) and Chinese (zh)
 * translations and auto-translates them using Google Cloud Translation API.
 *
 * This script is safe to run multiple times — it only translates fields that
 * are empty or null (unless --force is used).
 *
 * Usage:
 *   node scripts/translateBatch.js [options]
 *
 * Options:
 *   --model=Product      Only process a single model
 *                        (Product | Category | Article | Page | Hero | HomepageSection | Footer)
 *   --force              Re-translate fields even if sw/zh already exist
 *   --dry-run            Preview what would be translated — no writes to DB
 *   --lang=sw            Only translate to this language (default: all)
 *   --limit=100          Max documents to process per model (default: 500)
 *   --delay=200          Delay in ms between documents (default: 200) — rate-limit protection
 *   --batch-size=10      Documents to process in parallel per model (default: 5)
 *
 * Examples:
 *   node scripts/translateBatch.js
 *   node scripts/translateBatch.js --model=Product --limit=50
 *   node scripts/translateBatch.js --model=Article --force --dry-run
 *   node scripts/translateBatch.js --lang=sw --limit=200 --delay=300
 *
 * Environment:
 *   Reads .env (or .env.production for NODE_ENV=production)
 *   Requires GOOGLE_TRANSLATE_API_KEY to be set.
 *   Requires MONGO_URI for database connection.
 */

'use strict';

// ─── Load dotenv before anything else ────────────────────────────────────────
const path = require('path');
const dotenv = require('dotenv');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

// ─── Validate prerequisites ───────────────────────────────────────────────────
if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
  console.error('\n[translateBatch] ERROR: GOOGLE_TRANSLATE_API_KEY is not set.');
  console.error('  Add it to your .env file and try again.\n');
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error('\n[translateBatch] ERROR: MONGO_URI is not set.\n');
  process.exit(1);
}

// ─── Imports ──────────────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const translationService = require('../src/services/translationService');

// ─── CLI argument parser ──────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, val] = arg.slice(2).split('=');
      args[key] = val !== undefined ? val : true;
    }
  }
  return args;
}

const args = parseArgs(process.argv);
const TARGET_MODEL    = args.model      || null;
const FORCE           = args.force      === true || args.force === 'true';
const DRY_RUN         = args['dry-run'] === true || args['dry-run'] === 'true';
const LANG_FILTER     = args.lang       || null;   // 'sw' | 'zh' | null (both)
const LIMIT           = parseInt(args.limit, 10)        || 500;
const DELAY_MS        = parseInt(args.delay, 10)        || 200;
const BATCH_SIZE      = parseInt(args['batch-size'], 10) || 5;

// ─── Model definitions ────────────────────────────────────────────────────────
// Each entry describes a model and which fields to translate.
// field.enSource(doc) → English text
// field.targetPath    → MongoDB path prefix where sw/zh are stored (e.g. 'localizedTitle')
// field.directObject  → true when sw/zh are stored as doc[targetPath].sw (e.g. articles)
// ─────────────────────────────────────────────────────────────────────────────

const MODEL_DEFINITIONS = {
  Product: {
    modelFile: '../src/modules/products/product.model',
    fields: [
      {
        key: 'title',
        enSource: (doc) => doc.localizedTitle?.en || doc.title,
        missingFilter: (f) => ({
          $or: [
            { [`${f.targetPath}.sw`]: { $in: [null, ''] } },
            { [`${f.targetPath}.zh`]: { $in: [null, ''] } },
          ],
        }),
        targetPath: 'localizedTitle',
      },
      {
        key: 'description',
        enSource: (doc) => doc.localizedDescription?.en || doc.description,
        missingFilter: (f) => ({
          $or: [
            { [`${f.targetPath}.sw`]: { $in: [null, ''] } },
            { [`${f.targetPath}.zh`]: { $in: [null, ''] } },
          ],
        }),
        targetPath: 'localizedDescription',
      },
    ],
  },

  Category: {
    modelFile: '../src/modules/categories/category.model',
    fields: [
      {
        key: 'name',
        enSource: (doc) => doc.localizedName?.en || doc.name,
        targetPath: 'localizedName',
      },
      {
        key: 'description',
        enSource: (doc) => doc.localizedDescription?.en || doc.description,
        targetPath: 'localizedDescription',
      },
    ],
  },

  Article: {
    modelFile: '../src/modules/articles/article.model',
    fields: [
      {
        key: 'title',
        enSource: (doc) => doc.title?.en,
        targetPath: 'title',
        directObject: true,
      },
      {
        key: 'excerpt',
        enSource: (doc) => doc.excerpt?.en,
        targetPath: 'excerpt',
        directObject: true,
      },
    ],
    // Articles also have content blocks — handled separately below
    translateBlocks: true,
  },

  Page: {
    modelFile: '../src/modules/pages/page.model',
    fields: [
      {
        key: 'title',
        enSource: (doc) => doc.title?.en,
        targetPath: 'title',
        directObject: true,
      },
    ],
    translateBlocks: true,
  },

  Hero: {
    modelFile: '../src/modules/hero/hero.model',
    fields: [
      {
        key: 'title',
        enSource: (doc) => doc.localizedTitle?.en || doc.title,
        targetPath: 'localizedTitle',
      },
      {
        key: 'eyebrow',
        enSource: (doc) => doc.localizedEyebrow?.en || doc.eyebrow,
        targetPath: 'localizedEyebrow',
      },
      {
        key: 'description',
        enSource: (doc) => doc.localizedDescription?.en || doc.description,
        targetPath: 'localizedDescription',
      },
      {
        key: 'ctaText',
        enSource: (doc) => doc.localizedCtaText?.en || doc.ctaText,
        targetPath: 'localizedCtaText',
      },
    ],
  },

  HomepageSection: {
    modelFile: '../src/modules/homepageSection/homepageSection.model',
    fields: [
      {
        key: 'headingEyebrow',
        enSource: (doc) => doc.heading?.eyebrow,
        targetPath: 'heading.localizedEyebrow',
        nestedPath: true,
      },
      {
        key: 'headingTitle',
        enSource: (doc) => doc.heading?.title,
        targetPath: 'heading.localizedTitle',
        nestedPath: true,
      },
      {
        key: 'headingDescription',
        enSource: (doc) => doc.heading?.description,
        targetPath: 'heading.localizedDescription',
        nestedPath: true,
      },
    ],
  },
};

// Determine which languages to translate into
const TARGET_LANGS = LANG_FILTER
  ? [LANG_FILTER].filter((l) => ['sw', 'zh'].includes(l))
  : ['sw', 'zh'];

if (TARGET_LANGS.length === 0) {
  console.error(`\n[translateBatch] ERROR: Invalid --lang value: ${LANG_FILTER}. Use 'sw' or 'zh'.\n`);
  process.exit(1);
}

// ─── Sleep helper ─────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Progress tracker ─────────────────────────────────────────────────────────
let grandTotal = 0;
let grandTranslated = 0;
let grandSkipped = 0;
let grandErrors = 0;

// ─── Document translator ──────────────────────────────────────────────────────

/**
 * Translate a single document and return the MongoDB $set payload.
 *
 * @param {object}   modelDef  Entry from MODEL_DEFINITIONS
 * @param {object}   doc       Lean MongoDB document
 * @returns {{ $set: object, translatedCount: number }}
 */
async function translateDoc(modelDef, doc) {
  const $set = {};
  let translatedCount = 0;
  let apiFailures = 0;

  for (const field of modelDef.fields) {
    const enText = field.enSource(doc);
    if (!enText || !String(enText).trim()) continue;

    // Determine which langs need translation
    const langsNeeded = TARGET_LANGS.filter((lang) => {
      if (FORCE) return true;
      // For nested paths like 'heading.localizedEyebrow'
      const pathParts = field.targetPath.split('.');
      let val = doc;
      for (const p of pathParts) val = val?.[p];
      return !val?.[lang];
    });

    if (langsNeeded.length === 0) continue;

    const results = await Promise.all(
      langsNeeded.map((lang) => translationService.translateText(enText, lang))
    );

    langsNeeded.forEach((lang, i) => {
      if (results[i]) {
        $set[`${field.targetPath}.${lang}`] = results[i];
        translatedCount++;
      } else {
        // translateText returns '' on API failure — surface it as a real error
        console.error(
          `    ✗ API returned empty for field "${field.key}" → ${lang}` +
          ` (check GOOGLE_TRANSLATE_API_KEY and API quota)`
        );
        apiFailures++;
      }
    });
  }

  // Handle content blocks for articles and pages
  if (modelDef.translateBlocks && doc.contentBlocks?.length > 0) {
    const updatedBlocks = await translationService.translateContentBlocks(
      doc.contentBlocks,
      FORCE
    );

    // Only include blocks that actually changed
    const changed = updatedBlocks.some((b, i) => {
      const orig = doc.contentBlocks[i];
      return JSON.stringify(b.data) !== JSON.stringify(orig?.data);
    });

    if (changed) {
      $set['contentBlocks'] = updatedBlocks;
      translatedCount++;
    }
  }

  return { $set, translatedCount, apiFailures };
}

// ─── Model processor ──────────────────────────────────────────────────────────

async function processModel(modelName, modelDef) {
  console.log(`\n━━━ ${modelName} ${'─'.repeat(50 - modelName.length)}`);

  const Model = require(path.resolve(__dirname, modelDef.modelFile));

  // Build a filter to find docs with missing translations (skip if --force)
  let filter = {};
  if (!FORCE) {
    const orClauses = modelDef.fields.flatMap((field) => {
      if (field.nestedPath) {
        return TARGET_LANGS.map((lang) => ({
          [`${field.targetPath}.${lang}`]: { $in: [null, '', undefined] },
        }));
      }
      return TARGET_LANGS.map((lang) => ({
        [`${field.targetPath}.${lang}`]: { $in: [null, '', undefined] },
      }));
    });

    filter = orClauses.length > 0 ? { $or: orClauses } : {};
  }

  const total = await Model.countDocuments(filter);
  const toProcess = Math.min(total, LIMIT);

  console.log(`  Found ${total} documents needing translation (processing up to ${toProcess})`);

  if (toProcess === 0) {
    console.log(`  ✓ All documents are already translated`);
    return;
  }

  const cursor = Model.find(filter).limit(toProcess).lean();
  let processed = 0;
  let modelTranslated = 0;
  let modelErrors = 0;

  const docs = await cursor;

  // Process in small batches to stay within rate limits
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (doc) => {
        try {
          const { $set, translatedCount, apiFailures } = await translateDoc(modelDef, doc);

          if (apiFailures > 0) {
            modelErrors += apiFailures;
          }

          if (Object.keys($set).length === 0) {
            if (DRY_RUN) {
              console.log(`    [dry-run] ${doc._id}: no missing translations`);
            } else if (apiFailures === 0) {
              console.log(`    ~ ${doc._id}: skipped — English source fields are empty`);
            }
            return;
          }

          if (DRY_RUN) {
            console.log(`    [dry-run] ${doc._id}: would set`, Object.keys($set).join(', '));
          } else {
            await Model.findByIdAndUpdate(doc._id, { $set });
            console.log(`    ✓ ${doc._id}: updated ${Object.keys($set).length} field(s)`);
          }

          modelTranslated += translatedCount;
        } catch (err) {
          console.error(`    ✗ ${doc._id}: ${err.message}`);
          modelErrors++;
        } finally {
          processed++;
        }
      })
    );

    // Rate-limit protection between batches
    if (i + BATCH_SIZE < docs.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`  Processed: ${processed} docs | Translated: ${modelTranslated} fields | Errors: ${modelErrors}`);

  grandTotal += processed;
  grandTranslated += modelTranslated;
  grandErrors += modelErrors;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║        CMS Batch Translation — MukonoTalks            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`  Languages:  ${TARGET_LANGS.join(', ')}`);
  console.log(`  Force:      ${FORCE}`);
  console.log(`  Dry-run:    ${DRY_RUN}`);
  console.log(`  Limit/model:${LIMIT}`);
  console.log(`  Delay:      ${DELAY_MS}ms`);
  console.log(`  Batch size: ${BATCH_SIZE}`);
  if (TARGET_MODEL) console.log(`  Target:     ${TARGET_MODEL} only`);
  console.log('');

  // Connect to MongoDB
  console.log('  Connecting to MongoDB…');
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15_000,
    });
    console.log('  ✓ MongoDB connected\n');
  } catch (err) {
    console.error(`\n  ERROR: MongoDB connection failed: ${err.message}\n`);
    process.exit(1);
  }

  // Determine which models to process
  const modelNames = TARGET_MODEL
    ? [TARGET_MODEL]
    : Object.keys(MODEL_DEFINITIONS);

  const invalidModel = TARGET_MODEL && !MODEL_DEFINITIONS[TARGET_MODEL];
  if (invalidModel) {
    console.error(
      `\n  ERROR: Unknown model "${TARGET_MODEL}". ` +
      `Valid options: ${Object.keys(MODEL_DEFINITIONS).join(', ')}\n`
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  // Process each model sequentially to stay within API rate limits
  for (const modelName of modelNames) {
    await processModel(modelName, MODEL_DEFINITIONS[modelName]);
  }

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Summary                                                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`  Total documents processed : ${grandTotal}`);
  console.log(`  Total fields translated   : ${grandTranslated}`);
  console.log(`  Total errors              : ${grandErrors}`);
  if (grandErrors > 0 && grandTranslated === 0) {
    console.log('\n  ⚠  All translations failed. Possible causes:');
    console.log('     • GOOGLE_TRANSLATE_API_KEY is invalid or restricted');
    console.log('     • Google Cloud Translation API is not enabled for this key');
    console.log('     • Billing is not set up on the Google Cloud project');
    console.log('     • API quota exhausted');
    console.log('     Check server logs for detailed error messages from Google.');
  }
  if (DRY_RUN) {
    console.log('\n  ⚠  Dry-run mode — no changes were written to the database.');
  }
  console.log('');

  await mongoose.disconnect();
  console.log('  ✓ Done\n');
  process.exit(grandErrors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\n[translateBatch] Unhandled error:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
