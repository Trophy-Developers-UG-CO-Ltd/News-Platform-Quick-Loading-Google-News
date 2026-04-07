/**
 * MukonoTalks — Generic Bulk Product Importer
 *
 * Reads any CSV file that follows the bulk_products_template.csv format and
 * upserts all rows into MongoDB.
 *
 * Array fields   → separate values with a pipe  |  inside the CSV cell.
 * Boolean fields → use TRUE / FALSE (case-insensitive).
 * Variants       → columns named variant1_size, variant1_sku … variant2_size …
 *
 * Usage (from /server):
 *   node seeds/importBulkProducts.js [path/to/file.csv]
 *   npm run seed:bulk [-- path/to/file.csv]
 *
 * Defaults to:
 *   seeds/data/ion_exchange_catalyst_resins_template.csv
 *
 * @module seeds/importBulkProducts
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const fs       = require('fs');
const path     = require('path');
const csv      = require('csv-parser');
const mongoose = require('mongoose');
const slugify  = require('slugify');

const Product  = require('../src/modules/products/product.model');
const Category = require('../src/modules/categories/category.model');

// ─── Config ───────────────────────────────────────────────────────────────────
const MONGO_URI  = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mukonotalks';
const CSV_FILE   = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.join(__dirname, 'data', 'ion_exchange_catalyst_resins_template.csv');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const norm      = (v) => (v ? String(v).trim() : '');
const makeSlug  = (s) => slugify(s, { lower: true, strict: true });
const toBool    = (v) => String(v).trim().toLowerCase() === 'true';
const toNum     = (v) => { const n = parseFloat(norm(v)); return isNaN(n) ? undefined : n; };
const toInt     = (v) => { const n = parseInt(norm(v), 10); return isNaN(n) ? undefined : n; };

/** Split a pipe-separated cell into a clean, non-empty array. */
const splitPipe = (v) =>
  norm(v)
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

// ─── Parse CSV ────────────────────────────────────────────────────────────────
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

// ─── Category cache ───────────────────────────────────────────────────────────
const _catCache = {};
async function resolveCategory(name) {
  if (!name) throw new Error('Category name is required');
  if (_catCache[name]) return _catCache[name];

  const slug = makeSlug(name);
  let cat = await Category.findOne({ slug });
  if (!cat) {
    cat = await Category.create({ name, slug, isActive: true });
    console.log(`  ✔ Created category: "${name}"`);
  } else {
    console.log(`  ✓ Found  category: "${name}"`);
  }
  _catCache[name] = cat._id;
  return cat._id;
}

// ─── Extract variant columns ──────────────────────────────────────────────────
/**
 * Reads variant1_*, variant2_*, … from a CSV row.
 * Returns only variants with at least a size AND sku.
 */
function extractVariants(row) {
  const variants = [];
  let i = 1;
  while (true) {
    const prefix = `variant${i}_`;
    const size   = norm(row[`${prefix}size`]);
    const sku    = norm(row[`${prefix}sku`]);
    if (!size && !sku) break;          // no more variant columns
    if (size && sku) {
      const v = {
        size,
        sku:           sku.toUpperCase(),
        packagingType: norm(row[`${prefix}packagingType`]) || undefined,
        price:         toNum(row[`${prefix}price`]),
        stock:         toInt(row[`${prefix}stock`]) ?? 0,
        weight:        norm(row[`${prefix}weight`]) || undefined,
      };
      // strip undefined keys
      Object.keys(v).forEach((k) => v[k] === undefined && delete v[k]);
      variants.push(v);
    }
    i++;
  }
  return variants;
}

// ─── Map a single CSV row → product document ──────────────────────────────────
async function rowToProduct(row) {
  const title = norm(row.title);
  if (!title) return null;            // skip completely blank rows

  const categoryId = await resolveCategory(norm(row.category) || 'General');

  // ── Slug: derive from title; uniqueness is enforced in upsertProducts() ──
  const slug = makeSlug(title);

  // ── Core ──────────────────────────────────────────────────────────────────
  const doc = {
    title,
    slug,
    category: categoryId,
    description: norm(row.description) || `${title} — industrial chemical product.`,
  };

  // ── Optional text fields ──────────────────────────────────────────────────
  const optionalText = [
    'overview', 'resinType', 'pigmentType', 'casNumber', 'chemicalFormula',
    'leadTime', 'packaging', 'brand', 'manufacturer', 'material',
    'seoTitle', 'seoDescription', 'metaTitle', 'metaDescription', 'ogTitle', 'ogDescription',
  ];
  for (const key of optionalText) {
    const v = norm(row[key]);
    if (v) doc[key] = v;
  }

  // ── Array (pipe-separated) fields ─────────────────────────────────────────
  const arrayFields = [
    'features', 'benefits', 'applications', 'industriesServed',
    'keyFeatures', 'tags', 'technicalKeywords', 'seoKeywords',
  ];
  for (const key of arrayFields) {
    const arr = splitPipe(row[key]);
    if (arr.length) doc[key] = arr;
  }

  // ── Numeric / commerce fields ─────────────────────────────────────────────
  const price = toNum(row.price);
  if (price !== undefined) doc.price = price;

  const stock = toInt(row.stock);
  if (stock !== undefined) doc.stock = stock;

  const moq = toInt(row.minimumOrderQuantity);
  if (moq !== undefined) doc.minimumOrderQuantity = moq;

  // ── Enum fields ───────────────────────────────────────────────────────────
  const availability = norm(row.availability);
  if (availability) doc.availability = availability;

  const currency = norm(row.priceCurrency).toUpperCase();
  if (currency) doc.priceCurrency = currency;

  const publishStatus = norm(row.publishStatus);
  if (publishStatus) doc.publishStatus = publishStatus;

  // ── Boolean fields ────────────────────────────────────────────────────────
  doc.isActive     = norm(row.isActive)     ? toBool(row.isActive)     : true;
  doc.isRestricted = norm(row.isRestricted) ? toBool(row.isRestricted) : false;

  // ── Variants ──────────────────────────────────────────────────────────────
  const variants = extractVariants(row);

  return { doc, variants };
}

// ─── Slug deduplication ───────────────────────────────────────────────────────
function deduplicateSlugs(products) {
  const slugCount = {};
  return products.map(({ doc, variants }) => {
    const base = doc.slug;
    slugCount[base] = (slugCount[base] || 0) + 1;
    const slug = slugCount[base] === 1 ? base : `${base}-${slugCount[base]}`;
    return { doc: { ...doc, slug }, variants };
  });
}

// ─── Upsert ───────────────────────────────────────────────────────────────────
async function upsertProducts(products) {
  if (!products.length) return { upserted: 0, modified: 0 };

  const ops = products.map(({ doc, variants }) => ({
    updateOne: {
      filter: { slug: doc.slug },
      update: {
        $set:         doc,
        $setOnInsert: { variants: variants ?? [], images: [] },
      },
      upsert: true,
    },
  }));

  const result = await Product.bulkWrite(ops, { ordered: false });
  return {
    upserted: result.upsertedCount ?? 0,
    modified: result.modifiedCount ?? 0,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n══ MukonoTalks — Bulk Product Importer ══════════════\n');
  console.log(`CSV file : ${CSV_FILE}\n`);

  if (!fs.existsSync(CSV_FILE)) {
    console.error(`ERROR: File not found — ${CSV_FILE}`);
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB…');
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10_000 });
    console.log('Connected ✔\n');

    console.log('Parsing CSV…');
    const rows = await parseCSV(CSV_FILE);
    // Skip header-only or empty files
    const dataRows = rows.filter((r) => norm(r.title));
    console.log(`  ${dataRows.length} product rows found\n`);

    if (!dataRows.length) {
      console.log('Nothing to import.');
      return;
    }

    console.log('Resolving categories…');
    const parsed = [];
    for (const row of dataRows) {
      const result = await rowToProduct(row);
      if (result) parsed.push(result);
    }
    console.log('');

    const deduped = deduplicateSlugs(parsed);

    console.log(`Building ${deduped.length} product document(s)…`);
    const { upserted, modified } = await upsertProducts(deduped);

    console.log('\n══ Import complete ════════════════════════════════════════');
    console.log(`  Inserted (new) : ${upserted}`);
    console.log(`  Updated        : ${modified}`);
    console.log(`  Total processed: ${deduped.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('\nImport failed:', err.message || err);
    if (process.env.NODE_ENV !== 'production') console.error(err.stack);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run();

// MukonoTalks

