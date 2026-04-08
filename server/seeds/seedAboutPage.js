/**
 * About Us CMS page seeder — MukonoTalks Ltd
 *
 * Creates (or updates) the "about" page in the Pages collection so admins
 * can edit it through Admin › Pages › about › Edit.
 *
 * Usage (from /server):
 *   node seeds/seedAboutPage.js
 *   npm run seed:about
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Page = require('../src/modules/pages/page.model');
const { getAboutPageSeed } = require('./data/cmsSeedData');

const ABOUT_PAGE = getAboutPageSeed();

/* ─────────────────────────────────────────────────────────────────
   RUNNER
   ───────────────────────────────────────────────────────────────── */

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌  MONGO_URI is not set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`✅  Connected: ${mongoose.connection.host}`);

  const existing = await Page.findOne({ pageKey: 'about' });

  if (existing) {
    // Update blocks + SEO but preserve publishStatus and audit fields
    existing.title = ABOUT_PAGE.title;
    existing.localizedSlug = ABOUT_PAGE.localizedSlug;
    existing.contentBlocks = ABOUT_PAGE.contentBlocks;
    existing.seo = ABOUT_PAGE.seo;
    if (existing.publishStatus !== 'published') {
      existing.publishStatus = 'published';
      existing.publishedAt = new Date();
    }
    await existing.save();
    console.log('✅  About page updated (existing record preserved)');
  } else {
    await Page.create(ABOUT_PAGE);
    console.log('✅  About page created and published');
  }

  console.log('─────────────────────────────────────────────────────');
  console.log('   Slug  : /about  (all languages)');
  console.log('   Blocks: 11 content blocks');
  console.log('   Edit  : Admin › Pages › about › Edit');
  console.log('─────────────────────────────────────────────────────');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌  seedAboutPage error:', err.message);
  process.exit(1);
});
