/**
 * Uganda News/Blog Style Home Sections Seeder for CMS
 * Fills all admin home section keys with demo content matching the Mukono homepage style.
 * Usage: node seeds/seedHomeSectionsUgandaBlog.js
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
    items: []
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
    items: []
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
    sectionKey: 'industries',
    isActive: false,
    order: 3,
    heading: { eyebrow: '', title: '', description: '' },
    items: []
  },
  {
    sectionKey: 'products',
    isActive: false,
    order: 4,
    heading: { eyebrow: '', title: '', description: '' },
    items: []
  },
  {
    sectionKey: 'advantages',
    isActive: false,
    order: 5,
    heading: { eyebrow: '', title: '', description: '' },
    items: []
  },
  {
    sectionKey: 'faq',
    isActive: true,
    order: 6,
    heading: {
      eyebrow: 'FAQ',
      title: 'Frequently Asked Questions',
      description: 'Answers to common questions from our readers.'
    },
    items: [
      { title: 'How do I submit a news tip?', description: 'Use the contact form or WhatsApp to send us your story or event.', order: 1 },
      { title: 'Can I join as a campus reporter?', description: 'Yes! Check our opportunities section for details.', order: 2 },
      { title: 'How do I advertise?', description: 'Visit the Advertise page or contact our sales team for packages.', order: 3 },
    ]
  },
  {
    sectionKey: 'cta',
    isActive: true,
    order: 7,
    heading: {
      eyebrow: 'Get Involved',
      title: 'Join the Mukono Talks Community',
      description: 'Become a contributor, share your story, or advertise with us.'
    },
    items: [
      { icon: 'PenLine', label: 'Write for Us', order: 1 },
      { icon: 'Megaphone', label: 'Advertise', order: 2 },
      { icon: 'Camera', label: 'Photo Stories', order: 3 },
    ],
    ctaButtons: [
      { text: 'Send News Tip', link: '/contact', variant: 'primary' },
      { text: 'Advertise With Us', link: '/advertise', variant: 'outline' },
    ]
  },
  {
    sectionKey: 'video',
    isActive: true,
    order: 8,
    heading: {
      eyebrow: 'Watch',
      title: 'Spice Diana - Siri Regular (Official Video)',
      description: 'Latest Ugandan music video releases and event highlights.'
    },
    videoUrl: 'https://www.youtube.com/embed/1V_xRb0x9aw',
    videoCaption: 'Spice Diana - Siri Regular (Official Video)',
    items: []
  },
  {
    sectionKey: 'opportunities',
    isActive: true,
    order: 9,
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
    sectionKey: 'inquiry',
    isActive: true,
    order: 10,
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
  console.log(`✅  Uganda blog-style home sections seeded: ${sections.length}`);
  console.log('─────────────────────────────────────────────────────');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌  Seeder failed:', err.message);
  process.exit(1);
});
