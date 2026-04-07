/**
 * MukonoTalks — Product Seeder
 *
 * Imports pigments, polyester resins, and industry classification data
 * from three CSV sheets and upserts them into MongoDB.
 *
 * CSV sources:
 *   seeds/data/Pigments.csv                  — Type, Features, Application, Specification
 *   seeds/data/PolyesterResins.csv            — Model, Description, Features, Application
 *   seeds/data/ResinIndustryClassification.csv — Industry, ResinType, Description, Application
 *
 * Strategy:
 *   • Pigments  → one product per CSV row (~106 products)
 *   • Resins    → one product per CSV row (~48 products, 9 models)
 *   • Industry file enriches every resin product with real industriesServed values
 *   • Total: 154 products
 *
 * Duplicate safety:
 *   Uses bulkWrite updateOne + upsert:true keyed on `slug`, so re-running
 *   the seeder is idempotent — existing docs are refreshed, new ones inserted.
 *
 * Usage (from /server):
 *   node seeds/products.seed.js
 *   npm run seed:products
 *
 * @module seeds/products
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const fs      = require('fs');
const path    = require('path');
const csv     = require('csv-parser');
const mongoose = require('mongoose');
const slugify  = require('slugify');

// ─── Models ─────────────────────────────────────────────────────────────────
const Product  = require('../src/modules/products/product.model');
const Category = require('../src/modules/categories/category.model');

// ─── Config ──────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mukonotalks';

const DATA_DIR       = path.join(__dirname, 'data');
const PIGMENTS_FILE  = path.join(DATA_DIR, 'Pigments.csv');
const RESINS_FILE    = path.join(DATA_DIR, 'PolyesterResins.csv');
const INDUSTRY_FILE  = path.join(DATA_DIR, 'ResinIndustryClassification.csv');

// ─── Utility helpers ─────────────────────────────────────────────────────────

/** Trim a CSV cell value; returns '' for null/undefined. */
const norm = (v) => (v ? String(v).trim() : '');

/** Slugify a string — lowercase, strict (removes non-alphanumeric except hyphen). */
const makeSlug = (str) => slugify(str, { lower: true, strict: true });

/** Return a deduplicated, non-empty array. */
const unique = (arr) => [...new Set(arr.filter(Boolean))];

/**
 * Parse a CSV file into an array of row objects.
 * @param {string} filePath
 * @returns {Promise<Object[]>}
 */
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data',  (row) => rows.push(row))
      .on('end',   ()    => resolve(rows))
      .on('error', (err) => reject(err));
  });
}

// ─── Category helpers ─────────────────────────────────────────────────────────

/**
 * Find an existing category by slug, or create it if absent.
 * @param {string} name
 * @param {string} description
 * @returns {Promise<CategoryDocument>}
 */
async function findOrCreateCategory(name, description) {
  const slug = makeSlug(name);
  const existing = await Category.findOne({ slug });
  if (existing) {
    console.log(`  ✓ Category already exists: "${name}"`);
    return existing;
  }
  const created = await Category.create({ name, description, isActive: true });
  console.log(`  ✔ Created category:        "${name}"`);
  return created;
}

// ─── Build pigment product documents ─────────────────────────────────────────
/**
 * Produces ONE product per CSV row so every application variant is indexed
 * as a distinct product. Slug is derived from Type + Application to guarantee
 * per-row uniqueness.
 *
 * @param {Object[]} rows  - Parsed CSV rows
 * @param {ObjectId} catId - MongoDB Category _id
 * @returns {Object[]}
 */
function buildPigmentProducts(rows, catId) {
  return rows.map((row) => {
    const type        = norm(row.Type)        || 'KX Series';
    const application = norm(row.Application) || 'Industrial Application';
    const feature     = norm(row.Features);
    const spec        = norm(row.Specification);

    const title = `${type} — ${application}`;

    return {
      title,
      slug: makeSlug(title),
      category: catId,
      description:
        `${type} industrial pigment for ${application.toLowerCase()}.` +
        (feature ? ` Key property: ${feature}.` : '') +
        ' Engineered for high-performance plastics and coating applications.',
      applications:    [application],
      industriesServed: [
        'Plastics Manufacturing',
        'Coatings Manufacturing',
        'Construction Materials',
        'Masterbatch Production',
      ],
      keyFeatures: feature ? [feature] : [],
      technicalSpecifications: {
        series:        type,
        specification: spec,
      },
      pigmentType:       type,
      resinType:         undefined,
      tags:              ['pigment', 'kx-series', 'industrial', 'plastics', 'masterbatch', 'colorant'],
      technicalKeywords: ['pigment dispersion', 'color stability', 'heat resistance', 'UV resistance', 'polymer coloring', 'masterbatch'],
      isRestricted:      true,
      isActive:          true,
      images:            [],
      variants:          [],
    };
  });
}

// ─── Build resin product documents ───────────────────────────────────────────
/**
 * Produces ONE product per CSV row. Slug is derived from Model + Application
 * so each application variant becomes a distinct indexed product.
 *
 * @param {Object[]} rows  - Parsed CSV rows
 * @param {ObjectId} catId - MongoDB Category _id
 * @returns {Object[]}
 */
function buildResinProducts(rows, catId) {
  return rows.map((row) => {
    const model       = norm(row.Model)       || 'Unknown';
    const application = norm(row.Application) || 'Industrial Application';
    const feature     = norm(row.Features);
    const description = norm(row.Description);

    const title = `${model} — ${application}`;

    return {
      title,
      slug: makeSlug(title),
      category: catId,
      description:
        description ||
        `Polyester resin model ${model} for ${application.toLowerCase()}. Industrial-grade formulation for powder coating and composite applications.`,
      applications:    [application],
      industriesServed: [
        'Coatings Manufacturing',
        'Construction Materials',
        'Industrial Composites',
      ],
      keyFeatures: feature ? [feature] : [],
      technicalSpecifications: {
        model,
        notes: description,
      },
      resinType:         'Polyester Resin',
      pigmentType:       undefined,
      tags:              ['resin', 'polyester', 'powder-coating', `model-${model.toLowerCase()}`],
      technicalKeywords: ['polyester resin', 'powder coating', 'TGIC curing', 'UV resistance', 'weather resistance'],
      isRestricted:      true,
      isActive:          true,
      images:            [],
      variants:          [],
    };
  });
}

// ─── Enrich resins with industry classification data ──────────────────────────
/**
 * Merges industry data from the classification CSV into resin product docs.
 * Maps `ResinType` → set of unique `Industry` names and adds them to
 * `industriesServed`.
 *
 * @param {Object[]} resinProducts
 * @param {Object[]} industryRows
 * @returns {Object[]}
 */
function enrichWithIndustryData(resinProducts, industryRows) {
  // Build map: ResinType → Set<Industry>
  const industryMap = {};
  for (const row of industryRows) {
    const resinType = norm(row.ResinType);
    const industry  = norm(row.Industry);
    if (!resinType || !industry) continue;
    if (!industryMap[resinType]) industryMap[resinType] = new Set();
    industryMap[resinType].add(industry);
  }

  return resinProducts.map((product) => {
    const extra = industryMap[product.resinType]
      ? [...industryMap[product.resinType]]
      : [];
    return {
      ...product,
      industriesServed: unique([...product.industriesServed, ...extra]),
    };
  });
}

// ─── Upsert all products via bulkWrite ────────────────────────────────────────
/**
 * Performs a duplicate-safe upsert of all product documents.
 * Uses `slug` as the unique key — running the seeder again updates existing
 * products and inserts any new ones, leaving the rest untouched.
 *
 * @param {Object[]} products
 * @returns {Promise<{upserted: number, modified: number, total: number}>}
 */
async function upsertProducts(products) {
  if (products.length === 0) return { upserted: 0, modified: 0, total: 0 };

  // ── Slug deduplication ─────────────────────────────────────────────────────
  // Guard against two CSV rows that would produce an identical slug (e.g.
  // identical application text). Append -2, -3 … to make each slug unique
  // within the batch before hitting the DB.
  const slugCount = {};
  const deduped = products.map((doc) => {
    const base = doc.slug;
    slugCount[base] = (slugCount[base] || 0) + 1;
    const slug = slugCount[base] === 1 ? base : `${base}-${slugCount[base]}`;
    return { ...doc, slug };
  });

  const ops = deduped.map((doc) => {
    // Separate array fields that interact with unique sub-document indexes.
    // $set         — updates core scalar/object fields on every run (idempotent).
    // $setOnInsert — seeds array defaults only when creating a NEW document;
    //               leaves existing products' real variants/images untouched.
    const { variants, images, ...coreFields } = doc;

    return {
      updateOne: {
        filter: { slug: doc.slug },
        update: {
          $set:         coreFields,
          $setOnInsert: { variants: variants ?? [], images: images ?? [] },
        },
        upsert: true,
      },
    };
  });

  const result = await Product.bulkWrite(ops, { ordered: false });

  return {
    upserted: result.upsertedCount  ?? 0,
    modified: result.modifiedCount  ?? 0,
    total:    products.length,
  };
}

// ─── Main entry point ─────────────────────────────────────────────────────────
async function seedProducts() {
  console.log('\n══ MukonoTalks — Product Seeder ═══════════════════\n');

  try {
    // 1. Connect
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10_000 });
    console.log('Connected ✔\n');

    // 2. Parse all three CSV files in parallel
    console.log('Parsing CSV files...');
    const [pigmentRows, resinRows, industryRows] = await Promise.all([
      parseCSV(PIGMENTS_FILE),
      parseCSV(RESINS_FILE),
      parseCSV(INDUSTRY_FILE),
    ]);
    console.log(`  Pigments.csv                 — ${pigmentRows.length} rows`);
    console.log(`  PolyesterResins.csv          — ${resinRows.length} rows`);
    console.log(`  ResinIndustryClassification  — ${industryRows.length} rows\n`);

    // 3. Resolve (find or create) product categories
    console.log('Resolving categories...');
    const [pigmentCat, resinCat] = await Promise.all([
      findOrCreateCategory(
        'Pigments',
        'Industrial-grade pigment concentrates for plastics manufacturing, masterbatch production, and polymer compounding.',
      ),
      findOrCreateCategory(
        'Polyester Resins',
        'Saturated and unsaturated polyester resins for powder coating, composite, and industrial coating applications.',
      ),
    ]);
    console.log('');

    // 4. Build normalised product documents
    console.log('Building product documents...');
    const pigmentProducts = buildPigmentProducts(pigmentRows, pigmentCat._id);
    let   resinProducts   = buildResinProducts(resinRows, resinCat._id);
          resinProducts   = enrichWithIndustryData(resinProducts, industryRows);

    const allProducts = [...pigmentProducts, ...resinProducts];

    const resinModels = [...new Set(resinRows.map((r) => norm(r.Model)).filter(Boolean))];
    const industries  = [...new Set(industryRows.map((r) => norm(r.Industry)).filter(Boolean))];

    console.log(`  Pigment products:           ${pigmentProducts.length}  (1 per CSV row)`);
    console.log(`  Resin products:             ${resinProducts.length}  — models: ${resinModels.join(', ')}`);
    console.log(`  Industries mapped:          ${industries.length}  → ${industries.join(', ')}`);
    console.log(`  Total product documents:    ${allProducts.length}\n`);

    // 5. Upsert — idempotent, duplicate-safe
    console.log('Upserting products (slug-keyed, bulkWrite)...');
    const { upserted, modified, total } = await upsertProducts(allProducts);

    console.log('\n══ Seeder complete ════════════════════════════════════════');
    console.log(`  Inserted (new): ${upserted}`);
    console.log(`  Updated:        ${modified}`);
    console.log(`  Total:          ${total}`);
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('\nSeeder failed:', err.message || err);
    if (process.env.NODE_ENV !== 'production') console.error(err.stack);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedProducts();

// MukonoTalks

