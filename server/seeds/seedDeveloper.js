/**
 * Developer account seeder — MukonoTalks
 * Upserts the MukonoTalks account without touching any other collection.
 *
 * Usage (from /server):
 *   node seeds/seedDeveloper.js
 *   npm run seed:developer
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../src/modules/auth/auth.model');

const DEVELOPER = {
  name:        'MukonoTalks',
  email:       'developers@mukonotalks.ug',
  password:    'TrophyDev@R34567',
  role:        'developer',
  companyName: 'MukonoTalks',
  companyType: 'other',
  isApproved:  true,
  phone:       '+256 41 000 0099',
  address: {
    street:     '1 Developer Lane',
    city:       'Kampala',
    state:      'Central',
    postalCode: '2000',
    country:    'Uganda',
  },
  acceptedTermsAt: new Date(),
};

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌  MONGO_URI is not set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`✅  Connected: ${mongoose.connection.host}`);

  const hash = await bcrypt.hash(DEVELOPER.password, 12);

  await User.findOneAndUpdate(
    { email: DEVELOPER.email },
    { ...DEVELOPER, password: hash },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('─────────────────────────────────────────────────────');
  console.log('✅  Developer account upserted');
  console.log(`    Name     : ${DEVELOPER.name}`);
  console.log(`    Email    : ${DEVELOPER.email}`);
  console.log(`    Password : ${DEVELOPER.password}`);
  console.log(`    Role     : ${DEVELOPER.role}`);
  console.log('─────────────────────────────────────────────────────');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌  seedDeveloper error:', err.message);
  process.exit(1);
});

