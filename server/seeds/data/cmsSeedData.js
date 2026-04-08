/**
 * Shared CMS seed payloads.
 * Used by standalone seed scripts and the master seeder to keep output consistent.
 */

const HOMEPAGE_SECTIONS_SEED = [
  {
    sectionKey: 'intro',
    isActive: true,
    order: 0,
    heading: {
      eyebrow: '',
      title: 'Industrial Pigments, Resin Systems, and Specialty Chemical Materials',
      description: 'MukonoTalks supplies specification-grade pigments, resin systems, and specialty materials used in coatings manufacturing, plastics production, water treatment, and industrial processing.',
    },
    items: [],
  },
  {
    sectionKey: 'featured-products',
    isActive: true,
    order: 0,
    heading: {
      eyebrow: '',
      title: 'Featured Products',
      description: 'Selected materials used across industrial applications',
    },
    items: [],
  },
  {
    sectionKey: 'values',
    isActive: true,
    order: 0,
    heading: {
      eyebrow: '',
      title: 'Why Work With MukonoTalks',
      description: 'We combine supply reliability with technical depth to support industrial manufacturing operations.',
    },
    items: [
      { icon: 'ShieldCheck', title: 'Certified Quality', description: 'All products meet international safety and performance standards.', order: 1 },
      { icon: 'Truck', title: 'Reliable Distribution', description: 'Consistent supply and logistics across industrial networks.', order: 2 },
      { icon: 'Award', title: 'Technical Expertise', description: 'Application-driven support for manufacturing environments.', order: 3 },
      { icon: 'Users', title: 'B2B Partnerships', description: 'Dedicated account support for procurement teams.', order: 4 },
    ],
  },
  {
    sectionKey: 'industries',
    isActive: true,
    order: 1,
    heading: {
      eyebrow: 'Sectors We Serve',
      title: 'Industries & Applications',
      description: 'From coatings lines to water treatment plants, our chemical materials are specified by engineers and procurement teams across Africa and beyond.',
    },
    items: [
      { icon: 'PaintBucket', title: 'Coatings Manufacturing', description: 'High-performance pigments and resin systems for decorative, protective, and industrial coating formulations.', order: 1 },
      { icon: 'Factory', title: 'Plastics Manufacturing', description: 'Masterbatch pigments and specialty additives optimised for polyolefin, PVC, and engineering polymer production.', order: 2 },
      { icon: 'Building2', title: 'Construction Materials', description: 'Durable resins and functional additives used in composite panels, sealants, and protective construction materials.', order: 3 },
      { icon: 'Droplets', title: 'Water Treatment', description: 'Industrial-grade ion exchange resins for municipal and process water purification systems.', order: 4 },
    ],
  },
  {
    sectionKey: 'products',
    isActive: true,
    order: 2,
    heading: {
      eyebrow: 'Our Product Range',
      title: 'Product Applications',
      description: 'Specification-grade materials trusted by formulation chemists and procurement managers across Africa.',
    },
    items: [
      { icon: 'Palette', title: 'Industrial Pigments', description: 'Inorganic and organic pigments formulated for high heat stability, lightfastness, and compatibility with solvent-borne and waterborne systems.', link: '/products?category=pigments', order: 1 },
      { icon: 'Layers', title: 'Resin Systems', description: 'Alkyd, epoxy, and polyester resin solutions engineered for industrial coatings, adhesives, and composite material manufacturers.', link: '/products?category=resins', order: 2 },
      { icon: 'Zap', title: 'Fluorescent Pigments', description: 'Daylight fluorescent and effect pigments used in safety marking, packaging, and high-visibility industrial coatings.', link: '/products?category=fluorescent', order: 3 },
      { icon: 'Droplets', title: 'Ion Exchange Resins', description: 'Cation and anion exchange resins for water softening, demineralisation, and process water treatment applications.', link: '/products?category=ion-exchange', order: 4 },
    ],
    bottomCtaText: 'View Full Product Catalogue',
    bottomCtaLink: '/products',
  },
  {
    sectionKey: 'advantages',
    isActive: true,
    order: 3,
    heading: {
      eyebrow: 'Why Specify With Us',
      title: 'Technical Advantage',
      description: 'Beyond supply - we are a technical partner for manufacturers, engineers, and procurement professionals.',
    },
    items: [
      { icon: 'ShieldCheck', title: 'ISO-Certified Quality', description: 'Every batch is tested against international technical standards before dispatch. COA documentation provided on request.', order: 1 },
      { icon: 'FlaskConical', title: 'Application Engineering Support', description: 'Our technical team assists with formulation optimisation, compatibility testing, and process integration challenges.', order: 2 },
      { icon: 'Globe', title: 'Pan-African Distribution', description: 'Established logistics network across Southern, East, and West Africa with reliable lead times for bulk and LTL shipments.', order: 3 },
      { icon: 'FileText', title: 'Full Technical Documentation', description: 'Safety Data Sheets, Technical Data Sheets, and compliance certificates available to registered business accounts.', order: 4 },
      { icon: 'Microscope', title: 'R&D-Backed Formulations', description: 'Products developed in partnership with global chemical manufacturers - not repackaged commodity stock.', order: 5 },
      { icon: 'Headphones', title: 'Dedicated B2B Account Management', description: 'Named account managers for procurement teams, with direct lines for urgent supply or specification queries.', order: 6 },
    ],
  },
  {
    sectionKey: 'faq',
    isActive: true,
    order: 4,
    heading: {
      eyebrow: 'Common Questions',
      title: 'Frequently Asked Questions',
      description: 'Answers to common questions from procurement managers and technical buyers.',
    },
    items: [
      { title: 'Who are your products designed for?', description: 'Our products support manufacturers, formulation chemists, laboratory buyers, bulk distributors, and industrial processors across Africa. We operate exclusively on a B2B basis.', order: 1 },
      { title: 'Do you provide technical documentation?', description: 'Yes. Registered business accounts have full access to Technical Data Sheets (TDS), Safety Data Sheets (SDS), and compliance certificates for all products in our catalogue.', order: 2 },
      { title: 'What are your minimum order quantities?', description: 'MOQs vary by product line. Many pigments and resins are available from 25 kg. Ion exchange resins and bulk chemical materials have higher MOQs - contact our sales team for specific requirements.', order: 3 },
      { title: 'Can you assist with formulation or application challenges?', description: 'Yes. Our technical support team offers formulation guidance, compatibility advice, and process integration assistance. Reach out via your account dashboard or contact us directly.', order: 4 },
      { title: 'What countries do you supply to?', description: 'We supply across Southern Africa, East Africa, and West Africa, with an established logistics network for both LTL and full-container shipments. International supply enquiries are welcome.', order: 5 },
    ],
  },
  {
    sectionKey: 'cta',
    isActive: true,
    order: 5,
    heading: {
      eyebrow: 'Ready to Start?',
      title: 'Work With MukonoTalks',
      description: 'Register your business account to access technical documentation, product specifications, SDS files, and industrial supply support tailored for manufacturers and procurement teams.',
    },
    items: [
      { icon: 'FileText', label: 'Technical Documentation', order: 1 },
      { icon: 'Package', label: 'Bulk Pricing Access', order: 2 },
      { icon: 'Headphones', label: 'Dedicated Account Support', order: 3 },
    ],
    ctaButtons: [
      { text: 'Create Business Account', link: '/register', variant: 'primary' },
      { text: 'Contact Sales Team', link: '/contact', variant: 'outline' },
    ],
  },
  {
    sectionKey: 'video',
    isActive: true,
    order: 6,
    heading: {
      eyebrow: 'How We Work',
      title: 'Industrial Chemical Manufacturing',
      description: 'See how industrial pigments, resins, and specialty chemical materials are sourced, quality-tested, and supplied to manufacturers across Africa.',
    },
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1280&q=80',
    videoCaption: 'MukonoTalks · Manufacturing Process Overview',
  },
];

const ABOUT_PAGE_SEED = {
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
  seo: {
    en: {
      title: 'About Us | MukonoTalks Ltd',
      description: 'MukonoTalks Ltd - supplier of industrial pigments, polyester resins, ion exchange resins, and specialty chemical raw materials across East Africa.',
      keywords: 'industrial pigments, polyester resins, ion exchange resins, chemical raw materials, East Africa',
    },
  },
  contentBlocks: [
    {
      type: 'page-hero',
      order: 0,
      data: {
        en: {
          heading: 'About MukonoTalks',
          subtitle: 'MukonoTalks is a publishing-first platform for local news, entertainment, community updates, and video-led storytelling built for speed, discoverability, and sustainable media growth.',
          backgroundImage: 'https://images.unsplash.com/photo-1581092583537-20d51b4b4f1b?auto=format&fit=crop&w=1600&q=80',
          ctaText: 'Browse Products',
          ctaLink: '/products',
          secondaryCtaText: 'Request a Quote',
          secondaryCtaLink: '/get-quote',
          badge: 'Trusted Industrial Supplier',
        },
      },
    },
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
    {
      type: 'image',
      order: 3,
      data: {
        en: {
          src: 'https://images.unsplash.com/photo-1581093588401-22c1b7b49d0d?auto=format&fit=crop&w=800&q=80',
          alt: 'Chemical laboratory',
          caption: 'Quality Assured - All products verified',
          fullWidth: false,
        },
      },
    },
    {
      type: 'grid',
      order: 4,
      data: {
        en: {
          heading: 'Industries Supported',
          subheading: 'Our chemical raw materials are used across a wide range of high-demand manufacturing and processing industries.',
          columns: 3,
          items: [
            { icon: 'Paintbrush', title: 'Coatings Manufacturing', description: 'Pigments and resin systems for protective coatings, decorative paints, and industrial surface finishes.' },
            { icon: 'Factory', title: 'Plastics Manufacturing', description: 'Pigments and additives that enhance colour performance and durability in polymer materials.' },
            { icon: 'Droplets', title: 'Water Treatment', description: 'Ion exchange resins used in municipal and industrial water purification systems.' },
            { icon: 'FlaskConical', title: 'Composite Materials', description: 'Polyester resins for fiberglass, construction composites, and advanced material fabrication.' },
            { icon: 'Zap', title: 'Industrial Processing', description: 'Specialty raw materials for chemical processing plants and manufacturing facilities.' },
            { icon: 'TrendingUp', title: 'Export & Distribution', description: 'Pan-African chemical distribution network spanning East Africa and Southern Africa.' },
          ],
        },
      },
    },
    {
      type: 'grid',
      order: 5,
      data: {
        en: {
          heading: 'Chemical Product Portfolio',
          columns: 3,
          items: [
            { icon: 'FlaskConical', title: 'Industrial Pigments', description: 'Used in coatings manufacturing, polymer compounding, plastics production, and specialty material formulation.', linkText: 'View products', link: '/products' },
            { icon: 'Factory', title: 'Polyester Resins', description: 'Resin systems in coatings, composite materials, fiberglass structures, and construction materials.', linkText: 'View products', link: '/products' },
            { icon: 'Droplets', title: 'Ion Exchange Resins', description: 'Chemical purification systems used in industrial filtration and water treatment facilities.', linkText: 'View products', link: '/products' },
          ],
        },
      },
    },
    {
      type: 'video',
      order: 6,
      data: {
        en: {
          url: 'https://www.youtube.com/embed/BX6n1kA5B5M',
          title: 'Industrial Chemical Supply & Manufacturing',
          description: 'MukonoTalks collaborates with global chemical manufacturers to supply industrial materials supporting coatings production, plastics manufacturing, water purification, and advanced material formulation.',
        },
      },
    },
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
    {
      type: 'grid',
      order: 9,
      data: {
        en: {
          heading: 'Our Locations',
          subheading: 'Offices and distribution networks across East Africa and Asia to serve our international client base.',
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

const deepClone = (payload) => JSON.parse(JSON.stringify(payload));

const getHomepageSectionsSeed = () => deepClone(HOMEPAGE_SECTIONS_SEED);

const getAboutPageSeed = () => ({
  ...deepClone(ABOUT_PAGE_SEED),
  publishedAt: new Date(),
});

module.exports = {
  getHomepageSectionsSeed,
  getAboutPageSeed,
};
