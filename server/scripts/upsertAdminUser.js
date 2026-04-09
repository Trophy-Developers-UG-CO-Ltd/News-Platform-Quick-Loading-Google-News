// Usage: node scripts/upsertAdminUser.js
// This script creates or updates the admin user for MukonoTalks

const mongoose = require('mongoose');
const User = require('../src/modules/auth/auth.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mukonotalks';

const ADMIN_EMAIL = 'admin@mukonotalks.ug';
const ADMIN_PASSWORD = 'Admin@MukonoTalks2025!';
const ADMIN_NAME = 'Mukono Admin';

async function upsertAdmin() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });


  let user = await User.findOne({ email: ADMIN_EMAIL });
  if (user) {
    user.name = ADMIN_NAME;
    user.password = ADMIN_PASSWORD; // Set plain text, let pre-save hook hash it
    user.role = 'admin';
    user.isApproved = true;
    user.isDeactivated = false;
    await user.save();
    console.log('Admin user updated:', ADMIN_EMAIL);
  } else {
    user = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD, // Set plain text, let pre-save hook hash it
      role: 'admin',
      isApproved: true,
      isDeactivated: false,
      acceptedTermsAt: new Date(),
    });
    console.log('Admin user created:', ADMIN_EMAIL);
  }

  await mongoose.disconnect();
}

upsertAdmin().catch((err) => {
  console.error('Error upserting admin user:', err);
  process.exit(1);
});
