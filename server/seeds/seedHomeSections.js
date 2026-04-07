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

const sections = [
  /* ─────────────────  INTRO  ───────────────── */
  {
    sectionKey: 'intro',
    isActive:   true,
    order:      0,
    heading: {
      eyebrow:     '',
      title:       'Industrial Pigments, Resin Systems, and Specialty Chemical Materials',
      description: 'MukonoTalks supplies specification-grade pigments, resin systems, and specialty materials used in coatings manufacturing, plastics production, water treatment, and industrial processing.',
    },
    items: [],
  },

  /* ─────────────────  FEATURED PRODUCTS  ───────────────── */
  {
    sectionKey: 'featured-products',
    isActive:   true,
    order:      0,
    heading: {
      eyebrow:     '',
      title:       'Featured Products',
      description: 'Selected materials used across industrial applications',
    },
    items: [],
  },

  /* ─────────────────  VALUES  ───────────────── */
  {
    sectionKey: 'values',
    isActive:   true,
    order:      0,
    heading: {
      eyebrow:     '',
      title:       'Why Work With MukonoTalks',
      description: 'We combine supply reliability with technical depth to support industrial manufacturing operations.',
    },
    items: [
      { icon: 'ShieldCheck', title: 'Certified Quality',       description: 'All products meet international safety and performance standards.',          order: 1 },
      { icon: 'Truck',       title: 'Reliable Distribution',   description: 'Consistent supply and logistics across industrial networks.',                order: 2 },
      { icon: 'Award',       title: 'Technical Expertise',     description: 'Application-driven support for manufacturing environments.',                 order: 3 },
      { icon: 'Users',       title: 'B2B Partnerships',        description: 'Dedicated account support for procurement teams.',                           order: 4 },
    ],
  },

  /* ─────────────────  INDUSTRIES  ───────────────── */
  {
    sectionKey: 'industries',
    isActive:   true,
    order:      1,
    heading: {
      eyebrow:     'Sectors We Serve',
      title:       'Industries & Applications',
      description: 'From coatings lines to water treatment plants, our chemical materials are specified by engineers and procurement teams across Africa and beyond.',
    },
    items: [
      { icon: 'PaintBucket', title: 'Coatings Manufacturing',  description: 'High-performance pigments and resin systems for decorative, protective, and industrial coating formulations.', order: 1 },
      { icon: 'Factory',     title: 'Plastics Manufacturing',  description: 'Masterbatch pigments and specialty additives optimised for polyolefin, PVC, and engineering polymer production.', order: 2 },
      { icon: 'Building2',   title: 'Construction Materials',  description: 'Durable resins and functional additives used in composite panels, sealants, and protective construction materials.', order: 3 },
      { icon: 'Droplets',    title: 'Water Treatment',         description: 'Industrial-grade ion exchange resins for municipal and process water purification systems.', order: 4 },
    ],
  },

  /* ─────────────────  PRODUCTS  ───────────────── */
  {
    sectionKey: 'products',
    isActive:   true,
    order:      2,
    heading: {
      eyebrow:     'Our Product Range',
      title:       'Product Applications',
      description: 'Specification-grade materials trusted by formulation chemists and procurement managers across Africa.',
    },
    items: [
      { icon: 'Palette', title: 'Industrial Pigments',   description: 'Inorganic and organic pigments formulated for high heat stability, lightfastness, and compatibility with solvent-borne and waterborne systems.', link: '/products?category=pigments',    order: 1 },
      { icon: 'Layers',  title: 'Resin Systems',         description: 'Alkyd, epoxy, and polyester resin solutions engineered for industrial coatings, adhesives, and composite material manufacturers.',          link: '/products?category=resins',      order: 2 },
      { icon: 'Zap',     title: 'Fluorescent Pigments',  description: 'Daylight fluorescent and effect pigments used in safety marking, packaging, and high-visibility industrial coatings.',                       link: '/products?category=fluorescent', order: 3 },
      { icon: 'Droplets', title: 'Ion Exchange Resins',  description: 'Cation and anion exchange resins for water softening, demineralisation, and process water treatment applications.',                          link: '/products?category=ion-exchange', order: 4 },
    ],
    bottomCtaText: 'View Full Product Catalogue',
    bottomCtaLink: '/products',
  },

  /* ─────────────────  ADVANTAGES  ───────────────── */
  {
    sectionKey: 'advantages',
    isActive:   true,
    order:      3,
    heading: {
      eyebrow:     'Why Specify With Us',
      title:       'Technical Advantage',
      description: 'Beyond supply — we are a technical partner for manufacturers, engineers, and procurement professionals.',
    },
    items: [
      { icon: 'ShieldCheck',  title: 'ISO-Certified Quality',              description: 'Every batch is tested against international technical standards before dispatch. COA documentation provided on request.', order: 1 },
      { icon: 'FlaskConical', title: 'Application Engineering Support',    description: 'Our technical team assists with formulation optimisation, compatibility testing, and process integration challenges.', order: 2 },
      { icon: 'Globe',        title: 'Pan-African Distribution',           description: 'Established logistics network across Southern, East, and West Africa with reliable lead times for bulk and LTL shipments.', order: 3 },
      { icon: 'FileText',     title: 'Full Technical Documentation',       description: 'Safety Data Sheets, Technical Data Sheets, and compliance certificates available to registered business accounts.', order: 4 },
      { icon: 'Microscope',   title: 'R&D-Backed Formulations',            description: "Products developed in partnership with global chemical manufacturers — not repackaged commodity stock.", order: 5 },
      { icon: 'Headphones',   title: 'Dedicated B2B Account Management',   description: 'Named account managers for procurement teams, with direct lines for urgent supply or specification queries.', order: 6 },
    ],
  },

  /* ─────────────────  FAQ  ───────────────── */
  {
    sectionKey: 'faq',
    isActive:   true,
    order:      4,
    heading: {
      eyebrow:     'Common Questions',
      title:       'Frequently Asked Questions',
      description: 'Answers to common questions from procurement managers and technical buyers.',
    },
    items: [
      { title: 'Who are your products designed for?',                   description: 'Our products support manufacturers, formulation chemists, laboratory buyers, bulk distributors, and industrial processors across Africa. We operate exclusively on a B2B basis.', order: 1 },
      { title: 'Do you provide technical documentation?',               description: 'Yes. Registered business accounts have full access to Technical Data Sheets (TDS), Safety Data Sheets (SDS), and compliance certificates for all products in our catalogue.', order: 2 },
      { title: 'What are your minimum order quantities?',               description: 'MOQs vary by product line. Many pigments and resins are available from 25 kg. Ion exchange resins and bulk chemical materials have higher MOQs — contact our sales team for specific requirements.', order: 3 },
      { title: 'Can you assist with formulation or application challenges?', description: 'Yes. Our technical support team offers formulation guidance, compatibility advice, and process integration assistance. Reach out via your account dashboard or contact us directly.', order: 4 },
      { title: 'What countries do you supply to?',                      description: 'We supply across Southern Africa, East Africa, and West Africa, with an established logistics network for both LTL and full-container shipments. International supply enquiries are welcome.', order: 5 },
    ],
  },

  /* ─────────────────  CTA  ───────────────── */
  {
    sectionKey: 'cta',
    isActive:   true,
    order:      5,
    heading: {
      eyebrow:     'Ready to Start?',
      title:       'Work With MukonoTalks',
      description: 'Register your business account to access technical documentation, product specifications, SDS files, and industrial supply support tailored for manufacturers and procurement teams.',
    },
    items: [
      { icon: 'FileText',   label: 'Technical Documentation', order: 1 },
      { icon: 'Package',    label: 'Bulk Pricing Access',      order: 2 },
      { icon: 'Headphones', label: 'Dedicated Account Support', order: 3 },
    ],
    ctaButtons: [
      { text: 'Create Business Account', link: '/register', variant: 'primary'  },
      { text: 'Contact Sales Team',       link: '/contact',  variant: 'outline' },
    ],
  },

  /* ─────────────────  VIDEO  ───────────────── */
  {
    sectionKey: 'video',
    isActive:   true,
    order:      6,
    heading: {
      eyebrow:     'How We Work',
      title:       'Industrial Chemical Manufacturing',
      description: 'See how industrial pigments, resins, and specialty chemical materials are sourced, quality-tested, and supplied to manufacturers across Africa.',
    },
    videoUrl:     'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1280&q=80',
    videoCaption: 'MukonoTalks · Manufacturing Process Overview',
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
