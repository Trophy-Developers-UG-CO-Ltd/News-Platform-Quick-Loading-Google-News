// server/scripts/fixProductImageUrls.js
// Scans ALL collections for /uploads/… URLs and rewrites them to CDN URLs.
// Pass --dry-run to preview without saving.

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");

// Load all models that store image/file URLs
require("../src/modules/products/product.model");
require("../src/modules/hero/hero.model");
require("../src/modules/articles/article.model");
require("../src/modules/categories/category.model");
require("../src/modules/branding/branding.model");
require("../src/modules/pages/page.model");
require("../src/modules/documents/document.model");
require("../src/modules/homepageSection/homepageSection.model");
require("../src/modules/seo-core/metadata.model");

const CDN_ORIGIN = process.env.R2_PUBLIC_URL?.replace(/\/$/, "") || "https://cdn.mukonotalks.ug";
const DRY_RUN = process.argv.includes("--dry-run");

/** Convert any /uploads/… path to a CDN URL */
function fixUrl(url) {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("/uploads/")) {
    return `${CDN_ORIGIN}${url.replace("/uploads", "")}`;
  }
  return null;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`CDN origin: ${CDN_ORIGIN}`);
  console.log(`Mode: ${DRY_RUN ? "DRY-RUN" : "LIVE"}\n`);

  // ── 1. Scan every collection for /uploads/ references ──
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  let totalHits = 0;

  console.log("=== SCANNING ALL COLLECTIONS ===\n");

  for (const col of collections) {
    const docs = await db.collection(col.name).find({}).toArray();
    const hits = docs.filter((d) => JSON.stringify(d).includes("/uploads/"));
    if (hits.length) {
      totalHits += hits.length;
      console.log(`📁 ${col.name}: ${hits.length} document(s) with /uploads/`);
      for (const h of hits) {
        const matches = JSON.stringify(h).match(/\/uploads\/[^\s"\\]+/g) || [];
        console.log(`   _id: ${h._id}`);
        matches.forEach((m) => console.log(`      → ${m}`));
      }
      console.log();
    }
  }

  if (totalHits === 0) {
    console.log("✅ No /uploads/ URLs found in any collection.\n");
    await mongoose.disconnect();
    return;
  }

  console.log(`\nTotal documents with /uploads/: ${totalHits}\n`);

  if (DRY_RUN) {
    console.log("Re-run without --dry-run to apply fixes.");
    await mongoose.disconnect();
    return;
  }

  // ── 2. Fix Products ──
  const Product = mongoose.model("Product");
  let updated = 0;
  const products = await Product.find({});
  for (const p of products) {
    let changed = false;

    if (p.images?.length) {
      p.images = p.images.map((img) => {
        const raw = typeof img === "string" ? img : img?.url;
        const fixed = fixUrl(raw);
        if (fixed) {
          changed = true;
          return typeof img === "string"
            ? { url: fixed, alt: p.title || "" }
            : { ...(img.toObject?.() || img), url: fixed };
        }
        return img;
      });
    }

    if (p.gallery?.length) {
      p.gallery = p.gallery.map((g) => {
        const fixed = fixUrl(g?.url);
        if (fixed) { changed = true; return { ...(g.toObject?.() || g), url: fixed }; }
        return g;
      });
    }

    if (p.ogImage?.url) {
      const fixed = fixUrl(p.ogImage.url);
      if (fixed) { changed = true; p.ogImage.url = fixed; }
    }

    if (p.documents?.length) {
      p.documents = p.documents.map((d) => {
        const fixed = fixUrl(d?.url);
        if (fixed) { changed = true; return { ...(d.toObject?.() || d), url: fixed }; }
        return d;
      });
    }

    if (p.certifications?.length) {
      p.certifications = p.certifications.map((c) => {
        const fixed = fixUrl(c?.documentUrl);
        if (fixed) { changed = true; return { ...(c.toObject?.() || c), documentUrl: fixed }; }
        return c;
      });
    }

    if (changed) { updated++; await p.save(); console.log(`Product: ${p._id} — ${p.title}`); }
  }
  console.log(`Products fixed: ${updated}`);

  // ── 3. Fix Hero slides ──
  const Hero = mongoose.model("Hero");
  const heroes = await Hero.find({});
  let heroFixed = 0;
  for (const h of heroes) {
    let changed = false;
    for (const field of ["largeImage", "mobileImage"]) {
      const fixed = fixUrl(h[field]);
      if (fixed) { changed = true; h[field] = fixed; }
    }
    if (changed) { heroFixed++; await h.save(); console.log(`Hero: ${h._id}`); }
  }
  console.log(`Hero slides fixed: ${heroFixed}`);

  // ── 4. Fix Categories ──
  const Category = mongoose.model("Category");
  const cats = await Category.find({});
  let catFixed = 0;
  for (const c of cats) {
    let changed = false;
    if (c.image) { const f = fixUrl(c.image); if (f) { changed = true; c.image = f; } }
    if (c.ogImage) { const f = fixUrl(c.ogImage); if (f) { changed = true; c.ogImage = f; } }
    if (changed) { catFixed++; await c.save(); console.log(`Category: ${c._id} — ${c.name}`); }
  }
  console.log(`Categories fixed: ${catFixed}`);

  // ── 5. Fix Articles ──
  const Article = mongoose.model("Article");
  const articles = await Article.find({});
  let artFixed = 0;
  for (const a of articles) {
    const fixed = fixUrl(a.featuredImage);
    if (fixed) { a.featuredImage = fixed; artFixed++; await a.save(); console.log(`Article: ${a._id}`); }
  }
  console.log(`Articles fixed: ${artFixed}`);

  // ── 6. Fix Documents ──
  const Document = mongoose.model("Document");
  const docs = await Document.find({});
  let docFixed = 0;
  for (const d of docs) {
    const fixed = fixUrl(d.fileUrl);
    if (fixed) { d.fileUrl = fixed; docFixed++; await d.save(); console.log(`Document: ${d._id}`); }
  }
  console.log(`Documents fixed: ${docFixed}`);

  // ── 7. Fix Branding ──
  const Branding = mongoose.model("Branding");
  const brands = await Branding.find({});
  let brandFixed = 0;
  for (const b of brands) {
    let changed = false;
    for (const field of ["logoUrl", "faviconUrl"]) {
      const fixed = fixUrl(b[field]);
      if (fixed) { changed = true; b[field] = fixed; }
    }
    if (changed) { brandFixed++; await b.save(); console.log(`Branding: ${b._id}`); }
  }
  console.log(`Branding fixed: ${brandFixed}`);

  // ── 8. Fix Pages (deep Mixed content blocks) — raw string replace ──
  const pagesCol = db.collection("pages");
  const rawPages = await pagesCol.find({}).toArray();
  let pageFixed = 0;
  const uploadsRegex = /\/uploads\/([a-zA-Z0-9_\-/.]+)/g;
  for (const page of rawPages) {
    const original = JSON.stringify(page);
    if (!original.includes("/uploads/")) continue;
    const patched = original.replace(uploadsRegex, `${CDN_ORIGIN}/$1`);
    if (patched !== original) {
      pageFixed++;
      console.log(`Page: ${page._id} — ${page.pageKey}`);
      await pagesCol.replaceOne({ _id: page._id }, JSON.parse(patched));
    }
  }
  console.log(`Pages fixed: ${pageFixed}`);

  // ── 9. Fix any remaining docs in other collections via raw scan ──
  let miscFixed = 0;
  const handledCollections = new Set([
    "products", "heroes", "categories", "articles", "documents", "brandings", "pages",
  ]);
  for (const col of collections) {
    if (handledCollections.has(col.name)) continue;
    const coll = db.collection(col.name);
    const rawDocs = await coll.find({}).toArray();
    for (const doc of rawDocs) {
      const original = JSON.stringify(doc);
      if (!original.includes("/uploads/")) continue;
      const patched = original.replace(uploadsRegex, `${CDN_ORIGIN}/$1`);
      if (patched !== original) {
        miscFixed++;
        console.log(`${col.name}: ${doc._id}`);
        await coll.replaceOne({ _id: doc._id }, JSON.parse(patched));
      }
    }
  }
  if (miscFixed) console.log(`Other collections fixed: ${miscFixed}`);

  console.log("\n✅ Done.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});