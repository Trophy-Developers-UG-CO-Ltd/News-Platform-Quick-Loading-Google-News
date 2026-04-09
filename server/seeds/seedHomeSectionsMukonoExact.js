/**
 * Exact Mukono Homepage Sections Seeder for CMS
 * Ensures CMS home sections match the MukonoHome page exactly, with premium demo content.
 * Usage: node seeds/seedHomeSectionsMukonoExact.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const HomepageSection = require('../src/modules/homepageSection/homepageSection.model');

const sections = [
  {
    sectionKey: 'intro',
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
    sectionKey: 'featured-products',
    isActive: true,
    order: 1,
    heading: {
      eyebrow: 'Featured',
      title: 'Sheebah, Cindy Set for Epic Music Battle at Kololo',
      description: 'Uganda’s top divas Sheebah and Cindy are set to face off in a live concert showdown. Who will take the crown?'
    },
    items: [
      {
        title: 'Sheebah, Cindy Set for Epic Music Battle at Kololo',
        description: 'Uganda’s top divas Sheebah and Cindy are set to face off in a live concert showdown. Who will take the crown?',
        featuredImage: 'https://i0.wp.com/mbu.ug/wp-content/uploads/2023/08/Bajjo-X-Abtex.webp?resize=800%2C600&ssl=1&w=370',
        link: '/news/sheebah-cindy-music-battle',
        order: 1
      },
      {
        title: 'Bobi Wine Launches New Documentary on Netflix',
        description: 'The Ghetto President’s life story hits the global stage. Here’s what to expect from the much-anticipated film.',
        featuredImage: 'https://i0.wp.com/mbu.ug/wp-content/uploads/2023/08/Bobi-Wine-Netflix.jpg?resize=800%2C600&ssl=1&w=370',
        link: '/news/bobi-wine-netflix-doc',
        order: 2
      }
    ]
  },
  {
    sectionKey: 'values',
    isActive: true,
    order: 2,
    heading: {
      eyebrow: 'Why Read Us',
      title: 'Your Source for Ugandan Pop Culture',
      description: 'From music to campus life, we bring you the latest and most exciting stories.'
    },
    items: [
      { icon: 'Music', title: 'Entertainment', description: 'Exclusive news on Uganda’s music, celebs, and events.', order: 1 },
      { icon: 'GraduationCap', title: 'Campus Vibes', description: 'Trends, fashion, and stories from Uganda’s top universities.', order: 2 },
      { icon: 'Users', title: 'Community', description: 'Spotlight on local heroes, bloggers, and youth initiatives.', order: 3 },
    ]
  },
  {
    sectionKey: 'opportunities',
    isActive: true,
    order: 3,
    heading: {
      eyebrow: 'Opportunities',
      title: 'Join Our Team',
      description: 'Open roles for campus reporters, bloggers, and creatives.'
    },
    items: [
      { icon: 'PenLine', title: 'Campus Reporter', description: 'Cover events and stories from your university.', link: '/careers/campus-reporter', order: 1 },
      { icon: 'Camera', title: 'Event Photographer', description: 'Capture the best moments at concerts and festivals.', link: '/careers/event-photographer', order: 2 },
      { icon: 'Users', title: 'Community Blogger', description: 'Share your voice and stories from your neighborhood.', link: '/careers/community-blogger', order: 3 },
    ]
  },
  {
    sectionKey: 'video',
    isActive: true,
    order: 4,
    heading: {
      eyebrow: 'Watch',
      title: 'Spice Diana - Siri Regular (Official Video)',
      description: 'Latest Ugandan music video releases and event highlights.'
    },
    videoUrl: 'https://www.youtube.com/embed/1V_xRb0x9aw',
    videoCaption: 'Spice Diana - Siri Regular (Official Video)',
    items: [
      { title: 'MTN Pulse Cypher Finals', description: 'Watch the best freestyle rap talent in Uganda.' },
      { title: 'Campus Comedy Night Highlights', description: 'Funniest moments from Makerere’s stand-up event.' },
      { title: 'Uganda Fashion Week Recap', description: 'Top designers and runway looks from Kampala.' },
      { title: 'Bobi Wine Live at One Love Beach', description: 'Exclusive concert footage and interviews.' }
    ]
  },
  {
    sectionKey: 'inquiry',
    isActive: true,
    order: 5,
    heading: {
      eyebrow: 'Contact',
      title: 'Contact the Mukono Talks Team',
      description: 'Got a hot story, event tip, or want to advertise? Reach out and let’s connect!'
    },
    ctaButtons: [
      { text: 'Send News Tip', link: '/contact', variant: 'primary' },
      { text: 'Advertise With Us', link: '/advertise', variant: 'outline' },
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
  console.log(`✅  Mukono homepage sections (exact) seeded: ${sections.length}`);
  console.log('─────────────────────────────────────────────────────');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌  Seeder failed:', err.message);
  process.exit(1);
});
