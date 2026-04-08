/**
 * Subscriber (customer) account seeder — MukonoTalks
 * Upserts a demo subscriber account without touching any other collection.
 *
 * Usage (from /server):
 *   node seeds/seedSubscriber.js
 *   npm run seed:subscriber
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../src/modules/auth/auth.model');

const SUBSCRIBER = {
  name:        'Demo Subscriber',
  email:       'subscriber@mukonotalks.ug',
  password:    'Subscriber@MukonoTalks2025!',
  role:        'customer',
  companyName: 'MukonoTalks Reader',
  companyType: 'other',
  isApproved:  true,
  phone:       '+256 75 530 3076',
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

  const hash = await bcrypt.hash(SUBSCRIBER.password, 12);

  await User.findOneAndUpdate(
    { email: SUBSCRIBER.email },
    { ...SUBSCRIBER, password: hash },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('─────────────────────────────────────────────────────');
  console.log('✅  Subscriber account upserted');
  console.log(`    Name     : ${SUBSCRIBER.name}`);
  console.log(`    Email    : ${SUBSCRIBER.email}`);
  console.log(`    Password : ${SUBSCRIBER.password}`);
  console.log(`    Role     : ${SUBSCRIBER.role}`);
  console.log('─────────────────────────────────────────────────────');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌  seedSubscriber error:', err.message);
  process.exit(1);
});
