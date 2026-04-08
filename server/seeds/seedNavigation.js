/**
 * Navigation-only seeder — MukonoTalks
 * Seeds admin-managed navigation items used by the premium top ticker/menu.
 *
 * Usage (from /server):
 *   node seeds/seedNavigation.js
 *   npm run seed:nav
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const NavItem = require('../src/modules/navigation/nav.model');

const navItems = [
  {
    label: 'Politics update',
    href: '/local',
    order: 0,
    isVisible: true,
    isExternal: false,
    openInNewTab: false,
    icon: 'Landmark',
    iconPosition: 'before',
    textWeight: 'medium',
  },
  {
    label: 'Celebrity news',
    href: '/entertainment',
    order: 1,
    isVisible: true,
    isExternal: false,
    openInNewTab: false,
    icon: 'Sparkles',
    iconPosition: 'before',
    textWeight: 'medium',
  },
  {
    label: 'Jobs released',
    href: '/news',
    order: 2,
    isVisible: true,
    isExternal: false,
    openInNewTab: false,
    icon: 'Briefcase',
    iconPosition: 'before',
    textWeight: 'medium',
  },
  {
    label: 'Campus trends',
    href: '/news',
    order: 3,
    isVisible: true,
    isExternal: false,
    openInNewTab: false,
    icon: 'GraduationCap',
    iconPosition: 'before',
    textWeight: 'medium',
  },
  {
    label: 'Business stories',
    href: '/news',
    order: 4,
    isVisible: true,
    isExternal: false,
    openInNewTab: false,
    icon: 'TrendingUp',
    iconPosition: 'after',
    textWeight: 'semibold',
  },
];

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌  MONGO_URI not set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`✅  Connected: ${mongoose.connection.host}`);

  await NavItem.deleteMany({});
  await NavItem.insertMany(navItems);

  console.log('─────────────────────────────────────────────────────');
  console.log(`✅  Navigation items seeded: ${navItems.length}`);
  navItems.forEach((item) => console.log(`    [${item.order}] ${item.label} -> ${item.href}`));
  console.log('─────────────────────────────────────────────────────');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌  seedNavigation error:', err.message);
  process.exit(1);
});
