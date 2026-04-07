/**
 * About Us CMS page seeder — MukonoTalks Ltd
 *
 * Creates (or updates) the "about" page in the Pages collection so admins
 * can edit it through Admin › Pages › about › Edit.
 *
 * Usage (from /server):
 *   node seeds/seedAboutPage.js
 *   npm run seed:about
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Page = require('../src/modules/pages/page.model');

/* ─────────────────────────────────────────────────────────────────
   CONTENT BLOCKS
   These map the original static design to the existing block types
   supported by BlockRenderer: hero | text | image | cta | grid | video | accordion
   ───────────────────────────────────────────────────────────────── */

const ABOUT_PAGE = {
  pageKey: 'about',

  localizedSlug: {
    en: 'about',
    zh: 'about',
    sw: 'about',
  },

  title: {
    en: 'About Us',
    zh: '关于我们',
    sw: 'Kuhusu Sisi',
  },

  publishStatus: 'published',
  publishedAt: new Date(),

  seo: {
    en: {
      title: 'About Us | MukonoTalks Ltd',
      description:
        'MukonoTalks Ltd — supplier of industrial pigments, polyester resins, ion exchange resins, and specialty chemical raw materials across East Africa.',
      keywords:
        'industrial pigments, polyester resins, ion exchange resins, chemical raw materials, East Africa',
    },
  },

  contentBlocks: [
    /* ── 0. HERO ────────────────────────────────────────────────── */
    {
      type: 'page-hero',
      order: 0,
      data: {
        en: {
          heading: 'About MukonoTalks',
          subtitle:
            'MukonoTalks is a publishing-first platform for local news, entertainment, community updates, and video-led storytelling built for speed, discoverability, and sustainable media growth.',
          backgroundImage:
            'https://images.unsplash.com/photo-1581092583537-20d51b4b4f1b?auto=format&fit=crop&w=1600&q=80',
          ctaText: 'Browse Products',
          ctaLink: '/products',
          secondaryCtaText: 'Request a Quote',
          secondaryCtaLink: '/get-quote',
          badge: 'Trusted Industrial Supplier',
        },
      },
    },

    /* ── 1. STATS BAR ──────────────────────────────────────────── */
    {
      type: 'grid',
      order: 1,
      data: {
        en: {
          heading: '',
          columns: 4,
          variant: 'stats',
          items: [
            { icon: 'Award', title: '10+', description: 'Years of Experience' },
            { icon: 'FlaskConical', title: '500+', description: 'Products in Catalogue' },
            { icon: 'Globe', title: '4', description: 'Country Offices' },
            { icon: 'Users', title: '1,000+', description: 'Business Clients' },
          ],
        },
      },
    },

    /* ── 2. WHO WE ARE (text + tags) ───────────────────────────── */
    {
      type: 'text',
      order: 2,
      data: {
        en: {
          heading: 'Industrial Chemical Raw Materials for Manufacturing Industries',
          body: [
            'MukonoTalks supplies chemical materials used across coatings production, plastics manufacturing, composite materials, water purification systems, and chemical processing facilities.',
            'By maintaining strong supplier partnerships and structured product classification, we help manufacturers identify reliable materials for modern industrial production environments.',
          ],
          highlight: 'ISO Compliant · SDS Documentation · Technical Support · Pan-African Delivery',
        },
      },
    },

    /* ── 3. WHO WE ARE (side image) ────────────────────────────── */
    {
      type: 'image',
      order: 3,
      data: {
        en: {
          src: 'https://images.unsplash.com/photo-1581093588401-22c1b7b49d0d?auto=format&fit=crop&w=800&q=80',
          alt: 'Chemical laboratory',
          caption: 'Quality Assured — All products verified',
          fullWidth: false,
        },
      },
    },

    /* ── 4. INDUSTRIES GRID ─────────────────────────────────────── */
    {
      type: 'grid',
      order: 4,
      data: {
        en: {
          heading: 'Industries Supported',
          subheading: 'Our chemical raw materials are used across a wide range of high-demand manufacturing and processing industries.',
          columns: 3,
          items: [
            {
              icon: 'Paintbrush',
              title: 'Coatings Manufacturing',
              description:
                'Pigments and resin systems for protective coatings, decorative paints, and industrial surface finishes.',
            },
            {
              icon: 'Factory',
              title: 'Plastics Manufacturing',
              description:
                'Pigments and additives that enhance colour performance and durability in polymer materials.',
            },
            {
              icon: 'Droplets',
              title: 'Water Treatment',
              description:
                'Ion exchange resins used in municipal and industrial water purification systems.',
            },
            {
              icon: 'FlaskConical',
              title: 'Composite Materials',
              description:
                'Polyester resins for fiberglass, construction composites, and advanced material fabrication.',
            },
            {
              icon: 'Zap',
              title: 'Industrial Processing',
              description:
                'Specialty raw materials for chemical processing plants and manufacturing facilities.',
            },
            {
              icon: 'TrendingUp',
              title: 'Export & Distribution',
              description:
                'Pan-African chemical distribution network spanning East Africa and Southern Africa.',
            },
          ],
        },
      },
    },

    /* ── 5. PRODUCT PORTFOLIO GRID ─────────────────────────────── */
    {
      type: 'grid',
      order: 5,
      data: {
        en: {
          heading: 'Chemical Product Portfolio',
          columns: 3,
          items: [
            {
              icon: 'FlaskConical',
              title: 'Industrial Pigments',
              description:
                'Used in coatings manufacturing, polymer compounding, plastics production, and specialty material formulation.',
              linkText: 'View products',
              link: '/products',
            },
            {
              icon: 'Factory',
              title: 'Polyester Resins',
              description:
                'Resin systems in coatings, composite materials, fiberglass structures, and construction materials.',
              linkText: 'View products',
              link: '/products',
            },
            {
              icon: 'Droplets',
              title: 'Ion Exchange Resins',
              description:
                'Chemical purification systems used in industrial filtration and water treatment facilities.',
              linkText: 'View products',
              link: '/products',
            },
          ],
        },
      },
    },

    /* ── 6. VIDEO ───────────────────────────────────────────────── */
    {
      type: 'video',
      order: 6,
      data: {
        en: {
          url: 'https://www.youtube.com/embed/BX6n1kA5B5M',
          title: 'Industrial Chemical Supply & Manufacturing',
          description:
            'MukonoTalks collaborates with global chemical manufacturers to supply industrial materials supporting coatings production, plastics manufacturing, water purification, and advanced material formulation.',
        },
      },
    },

    /* ── 7. DOCUMENTATION SECTION ───────────────────────────────── */
    {
      type: 'text',
      order: 7,
      data: {
        en: {
          heading: 'Structured Technical Documentation',
          body: [
            'MukonoTalks provides structured documentation for industrial buyers including product specifications, technical data sheets, and Safety Data Sheets (SDS).',
            'Registered business users can access extended technical documentation through secure account access.',
          ],
        },
      },
    },

    /* ── 8. DOCUMENTATION IMAGE ─────────────────────────────────── */
    {
      type: 'image',
      order: 8,
      data: {
        en: {
          src: 'https://images.unsplash.com/photo-1581091215367-59ab6f9c6f1c?auto=format&fit=crop&w=800&q=80',
          alt: 'Chemical documentation and technical sheets',
          caption: 'Technical Resources',
          fullWidth: false,
        },
      },
    },

    /* ── 9. LOCATIONS GRID ──────────────────────────────────────── */
    {
      type: 'grid',
      order: 9,
      data: {
        en: {
          heading: 'Our Locations',
          subheading:
            'Offices and distribution networks across East Africa and Asia to serve our international client base.',
          columns: 4,
          items: [
            { icon: 'MapPin', title: 'Kampala', description: 'Uganda' },
            { icon: 'MapPin', title: 'Nairobi', description: 'Kenya' },
            { icon: 'MapPin', title: 'Dar es Salaam', description: 'Tanzania' },
            { icon: 'MapPin', title: 'Guangzhou', description: 'China' },
          ],
        },
      },
    },

    /* ── 10. CTA ────────────────────────────────────────────────── */
    {
      type: 'cta',
      order: 10,
      data: {
        en: {
          heading: 'Work With MukonoTalks',
          text: 'Access technical documentation, product specifications, and industrial chemical supply support for your manufacturing operations.',
          buttonText: 'Create Business Account',
          buttonLink: '/register',
          secondaryButtonText: 'Browse Products',
          secondaryButtonLink: '/products',
          variant: 'dark',
        },
      },
    },
  ],
};

/* ─────────────────────────────────────────────────────────────────
   RUNNER
   ───────────────────────────────────────────────────────────────── */

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌  MONGO_URI is not set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`✅  Connected: ${mongoose.connection.host}`);

  const existing = await Page.findOne({ pageKey: 'about' });

  if (existing) {
    // Update blocks + SEO but preserve publishStatus and audit fields
    existing.title = ABOUT_PAGE.title;
    existing.localizedSlug = ABOUT_PAGE.localizedSlug;
    existing.contentBlocks = ABOUT_PAGE.contentBlocks;
    existing.seo = ABOUT_PAGE.seo;
    if (existing.publishStatus !== 'published') {
      existing.publishStatus = 'published';
      existing.publishedAt = new Date();
    }
    await existing.save();
    console.log('✅  About page updated (existing record preserved)');
  } else {
    await Page.create(ABOUT_PAGE);
    console.log('✅  About page created and published');
  }

  console.log('─────────────────────────────────────────────────────');
  console.log('   Slug  : /about  (all languages)');
  console.log('   Blocks: 11 content blocks');
  console.log('   Edit  : Admin › Pages › about › Edit');
  console.log('─────────────────────────────────────────────────────');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌  seedAboutPage error:', err.message);
  process.exit(1);
});
