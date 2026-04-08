/**
 * Admin-only seeder — MukonoTalks
 * Upserts the super admin user without touching any other collection.
 *
 * Usage (from /server):
 *   node seeds/seedAdmin.js
 *   npm run seed:admin
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../src/modules/auth/auth.model');

const ADMIN = {
  name:        'Super Admin',
  email:       'admin@mukonotalks.ug',
  password:    'Admin@MukonoTalks2025!',
  role:        'admin',
  companyName: 'MukonoTalks Uganda',
  companyType: 'other',
  isApproved:  true,
  phone:       '+256 41 000 0001',
  address: {
    street:     'Namirembe Road',
    city:       'Mukono',
    state:      'Central',
    postalCode: '256',
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

  const hash = await bcrypt.hash(ADMIN.password, 12);

  await User.findOneAndUpdate(
    { email: ADMIN.email },
    { ...ADMIN, password: hash },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('─────────────────────────────────────────────────────');
  console.log('✅  Super admin upserted');
  console.log(`    Email    : ${ADMIN.email}`);
  console.log(`    Password : ${ADMIN.password}`);
  console.log('─────────────────────────────────────────────────────');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌  seedAdmin error:', err.message);
  process.exit(1);
});
