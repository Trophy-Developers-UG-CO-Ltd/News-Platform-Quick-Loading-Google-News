/**
 * Mukono Home Page Sections Seeder (Uganda news/blog style)
 * Seeds homepage sections with local news, entertainment, and community content.
 * Usage: node seeds/seedMukonoHomeSections.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const HomepageSection = require('../src/modules/homepageSection/homepageSection.model');

const sections = [
  {
    sectionKey: 'hero',
    isActive: true,
    order: 0,
    heading: {
      eyebrow: 'Top Story',
      title: 'Spice Diana Drops New Hit, Fans Go Wild in Kampala!',
      description: 'Uganda’s music scene erupts as Spice Diana releases her latest single. See reactions, photos, and more.'
    },
    items: [
      {
        title: 'Spice Diana Drops New Hit, Fans Go Wild in Kampala!',
        description: 'Uganda’s music scene erupts as Spice Diana releases her latest single. See reactions, photos, and more.',
        featuredImage: 'https://i0.wp.com/mbu.ug/wp-content/uploads/2023/08/Spice-Diana.jpg?resize=800%2C600&ssl=1&w=370',
        link: '/news/spice-diana-new-hit',
        order: 1
      }
    ]
  },
  {
    sectionKey: 'campus',
    isActive: true,
    order: 1,
    heading: {
      eyebrow: 'Campus Vibes',
      title: 'Makerere Guild Elections Heat Up',
      description: 'All the drama, fashion, and campaign highlights from Uganda’s top university.'
    },
    items: [
      {
        title: 'Campus Fashion: Top Trends from Kyambogo Fresher’s Ball',
        description: 'From Ankara prints to streetwear, see what’s trending on campus this semester.',
        featuredImage: 'https://i0.wp.com/mbu.ug/wp-content/uploads/2023/08/Kyambogo-Fashion.jpg?resize=800%2C600&ssl=1&w=370',
        link: '/news/kyambogo-freshers-fashion',
        order: 1
      },
      {
        title: 'Campus Comedy Night Highlights',
        description: 'Funniest moments from Makerere’s stand-up event.',
        featuredImage: 'https://i0.wp.com/mbu.ug/wp-content/uploads/2023/08/Campus-Comedy.jpg?resize=800%2C600&ssl=1&w=370',
        link: '/news/campus-comedy-night',
        order: 2
      }
    ]
  },
  {
    sectionKey: 'entertainment',
    isActive: true,
    order: 2,
    heading: {
      eyebrow: 'Entertainment',
      title: 'Sheebah, Cindy Set for Epic Music Battle at Kololo',
      description: 'Uganda’s top divas Sheebah and Cindy are set to face off in a live concert showdown. Who will take the crown?'
    },
    items: [
      {
        title: 'Eddy Kenzo Wins Big at AFRIMA Awards 2026',
        description: 'Uganda’s music star brings home two major awards. Full winners list and red carpet moments inside.',
        featuredImage: 'https://i0.wp.com/mbu.ug/wp-content/uploads/2023/08/Eddy-Kenzo-AFRIMA.jpg?resize=800%2C600&ssl=1&w=370',
        link: '/news/eddy-kenzo-afrima-2026',
        order: 1
      },
      {
        title: 'Zari Hassan’s Birthday Bash: Celebs Turn Up in Style',
        description: 'Photos and highlights from the most glamorous party of the year.',
        featuredImage: 'https://i0.wp.com/mbu.ug/wp-content/uploads/2023/08/Zari-Birthday.jpg?resize=800%2C600&ssl=1&w=370',
        link: '/news/zari-birthday-bash',
        order: 2
      }
    ]
  },
  {
    sectionKey: 'sports',
    isActive: true,
    order: 3,
    heading: {
      eyebrow: 'Sports',
      title: 'Uganda Cranes Qualify for AFCON 2027',
      description: 'National pride as the Cranes secure a spot in Africa’s biggest football tournament.'
    },
    items: [
      {
        title: 'KCCA FC Signs New Striker from Kenya',
        description: 'The Kampala club hopes to boost its title chances with a new signing. Player profile and fan reactions.',
        featuredImage: 'https://i0.wp.com/mbu.ug/wp-content/uploads/2023/08/KCCA-FC-Striker.jpg?resize=800%2C600&ssl=1&w=370',
        link: '/news/kcca-fc-new-striker',
        order: 1
      }
    ]
  },
  {
    sectionKey: 'community',
    isActive: true,
    order: 4,
    heading: {
      eyebrow: 'Community',
      title: 'Opportunities & Community',
      description: 'Get involved! Join our team or share your story.'
    },
    items: [
      {
        title: 'Campus Reporter',
        description: 'Cover events and stories from your university. Open to all students.',
        link: '/careers/campus-reporter',
        order: 1
      },
      {
        title: 'Event Photographer',
        description: 'Capture the best moments at concerts and festivals.',
        link: '/careers/event-photographer',
        order: 2
      },
      {
        title: 'Community Blogger',
        description: 'Share your voice and stories from your neighborhood.',
        link: '/careers/community-blogger',
        order: 3
      }
    ]
  }
];

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
  console.log(`✅  Mukono home sections seeded: ${sections.length}`);
  console.log('─────────────────────────────────────────────────────');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌  Seeder failed:', err.message);
  process.exit(1);
});
