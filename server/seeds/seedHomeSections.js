/**
 * Homepage Sections seeder — MukonoTalks
 * Seeds all nine editable homepage section documents with default copy.
 *
 * Usage (from /server):
 *   node seeds/seedHomeSections.js
 *   npm run seed:home
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose       = require('mongoose');
const HomepageSection = require('../src/modules/homepageSection/homepageSection.model');
const { getHomepageSectionsSeed } = require('./data/cmsSeedData');

const sections = getHomepageSectionsSeed();

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌  MONGO_URI not set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`✅  Connected: ${mongoose.connection.host}`);

  for (const section of sections) {
    await HomepageSection.findOneAndUpdate(
      { sectionKey: section.sectionKey },
      { $set: section },
      { upsert: true, new: true }
    );
    console.log(`   ✓  Seeded: ${section.sectionKey}`);
  }

  console.log('─────────────────────────────────────────────────────');
  console.log(`✅  Homepage sections seeded: ${sections.length}`);
  console.log('─────────────────────────────────────────────────────');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌  Seeder failed:', err.message);
  process.exit(1);
});
