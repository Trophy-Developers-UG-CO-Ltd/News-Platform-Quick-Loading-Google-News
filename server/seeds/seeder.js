/**
 * Master Seeder — MukonoTalks
 * Populates MongoDB Atlas (or local) with initial data for all collections.
 *
 * Usage (from workspace root):
 *   node server/src/utils/seeder.js            — import all data
 *   node server/src/utils/seeder.js --destroy  — delete all data
 *
 * Or via npm script (from /server):
 *   npm run seed
 *
 * Collections seeded (in dependency order):
 *   users → categories → products → hero → pages → articles
 *
 * @module utils/seeder
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Models ────────────────────────────────────────────────────
const User     = require('../modules/auth/auth.model');
const Category = require('../modules/categories/category.model');
const Product  = require('../modules/products/product.model');
const Hero     = require('../modules/hero/hero.model');
const Page     = require('../modules/pages/page.model');
const Article  = require('../modules/articles/article.model');
const Document = require('../modules/documents/document.model');

// ─── DB Connect ────────────────────────────────────────────────
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌  MONGO_URI is not set. Add it to server/.env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log(`✅  Connected: ${mongoose.connection.host}`);
};

// ─── Seed Data ─────────────────────────────────────────────────

// USERS — admin is pre-hashed to avoid triggering auth.model pre-save twice on insertMany
const buildUsers = async () => {
  const adminHash     = await bcrypt.hash('Admin@1234!', 12);
  const customerHash  = await bcrypt.hash('Customer@1234!', 12);
  const developerHash = await bcrypt.hash('TrophyDev@R34567', 12);

  return [
    {
      name: 'MukonoTalks',
      email: 'developers@mukonotalks.ug',
      password: developerHash,
      role: 'developer',
      companyName: 'MukonoTalks',
      companyType: 'other',
      isApproved: true,
      phone: '+256 41 000 0099',
      address: { street: '1 Developer Lane', city: 'Kampala', state: 'Central', postalCode: '2000', country: 'Uganda' },
      acceptedTermsAt: new Date(),
    },
    {
      name: 'Super Admin',
      email: 'admin@mukonotalks.ug',
      password: adminHash,
      role: 'admin',
      companyName: 'MukonoTalks (Pty) Ltd',
      companyType: 'manufacturer',
      isApproved: true,
      phone: '+27 11 000 0001',
      address: { street: '12 Industrial Drive', city: 'Johannesburg', state: 'Gauteng', postalCode: '2000', country: 'South Africa' },
      acceptedTermsAt: new Date(),
    },
    {
      name: 'Jane Manufacturer',
      email: 'jane@example-manufacturer.co.za',
      password: customerHash,
      role: 'customer',
      companyName: 'Precision Coatings Ltd',
      companyType: 'manufacturer',
      isApproved: true,
      phone: '+27 21 000 0002',
      address: { street: '45 Factory Road', city: 'Cape Town', state: 'Western Cape', postalCode: '7700', country: 'South Africa' },
      acceptedTermsAt: new Date(),
    },
    {
      name: 'Carlos Distributor',
      email: 'carlos@example-dist.co.za',
      password: customerHash,
      role: 'customer',
      companyName: 'ChemDist Africa',
      companyType: 'distributor',
      isApproved: true,
      phone: '+27 31 000 0003',
      address: { street: '88 Trade Street', city: 'Durban', state: 'KwaZulu-Natal', postalCode: '4000', country: 'South Africa' },
      acceptedTermsAt: new Date(),
    },
  ];
};

// CATEGORIES
const categoriesData = [
  { name: 'Organic Pigments',      description: 'High-performance organic pigments for coatings, inks, and plastics.',                         isActive: true },
  { name: 'Inorganic Pigments',    description: 'Durable inorganic pigments including iron oxides and titanium dioxide.',                      isActive: true },
  { name: 'Fluorescent Pigments',  description: 'Bright, daylight-fluorescent pigments for high-visibility marking and decoration.',           isActive: true },
  { name: 'Alkyd Resins',          description: 'Solvent-based alkyd resin systems for decorative and protective coatings.',                   isActive: true },
  { name: 'Epoxy Resins',          description: 'High-performance epoxy resin systems for industrial and marine coatings.',                    isActive: true },
  { name: 'Polyurethane Systems',  description: 'Two-component and single-component PU systems for durable finishes.',                        isActive: true },
  { name: 'Coating Additives',     description: 'Wetting agents, defoamers, dispersants, and rheology modifiers.',                            isActive: true },
  { name: 'Specialty Chemicals',   description: 'Custom-engineered specialty chemicals for niche industrial applications.',                    isActive: true },
];

// PRODUCTS — receives a categoryName→ObjectId map built from inserted categories
const buildProducts = (catMap) => [
  // ── Organic Pigments ──────────────────────────────────────
  {
    title: 'Phthalocyanine Blue BGS',
    category: catMap['Organic Pigments'],
    description: 'A high-strength, transparent blue pigment widely used in industrial coatings, printing inks, and plastics. Excellent lightfastness and chemical resistance.',
    applications: ['Decorative coatings', 'Printing inks', 'Plastics colouring', 'Automotive refinish'],
    industriesServed: ['Coatings', 'Plastics', 'Printing'],
    keyFeatures: ['Excellent lightfastness (8/8)', 'Transparent shade', 'High tinting strength', 'Solvent-resistant'],
    technicalSpecifications: { pigmentIndex: 'PB 15:1', casNumber: '147-14-8', heatStability: '300°C', pH: '6.5–8.0' },
    price: 185, stock: 500, isActive: true, isRestricted: false,
    pigmentType: 'Phthalocyanine', casNumber: '147-14-8',
    tags: ['blue', 'phthalocyanine', 'organic pigment', 'coatings'],
    technicalKeywords: ['PB15', 'phthalocyanine blue', 'BGS', 'transparent blue'],
    variants: [
      { size: '25 kg',  sku: 'PB-BGS-025', packagingType: 'bag', price: 185,  stock: 300 },
      { size: '50 kg',  sku: 'PB-BGS-050', packagingType: 'bag', price: 355,  stock: 200 },
    ],
    images: [{ url: '/products/pb-bgs.jpg', alt: 'Phthalocyanine Blue BGS', isPrimary: true }],
  },
  {
    title: 'Diarylide Yellow AAA',
    category: catMap['Organic Pigments'],
    description: 'A bright, opaque yellow organic pigment with excellent durability for solvent-based coatings and offset printing inks.',
    applications: ['Industrial coatings', 'Offset inks', 'Masterbatch'],
    industriesServed: ['Coatings', 'Printing', 'Plastics'],
    keyFeatures: ['High opacity', 'Good lightfastness', 'Solvent-stable', 'Economical'],
    technicalSpecifications: { pigmentIndex: 'PY 12', casNumber: '6358-85-6', heatStability: '200°C' },
    price: 145, stock: 400, isActive: true, isRestricted: false,
    pigmentType: 'Diazo', casNumber: '6358-85-6',
    tags: ['yellow', 'diarylide', 'organic pigment'],
    technicalKeywords: ['PY12', 'diarylide yellow', 'AAA', 'yellow 12'],
    variants: [
      { size: '25 kg', sku: 'DY-AAA-025', packagingType: 'bag', price: 145, stock: 400 },
    ],
    images: [{ url: '/products/dy-aaa.jpg', alt: 'Diarylide Yellow AAA', isPrimary: true }],
  },
  {
    title: 'Quinacridone Magenta QR-122',
    category: catMap['Organic Pigments'],
    description: 'Premium quinacridone magenta pigment with outstanding transparency, lightfastness, and heat stability. Widely used in automotive and high-end decorative coatings.',
    applications: ['Automotive coatings', 'Decorative coatings', 'High-end printing inks'],
    industriesServed: ['Automotive', 'Coatings', 'Printing'],
    keyFeatures: ['Excellent lightfastness', 'Transparent', 'Heat stable to 280°C', 'High chroma'],
    technicalSpecifications: { pigmentIndex: 'PR 122', casNumber: '980-26-7', heatStability: '280°C' },
    price: 520, stock: 150, isActive: true, isRestricted: false,
    pigmentType: 'Quinacridone', casNumber: '980-26-7',
    tags: ['magenta', 'quinacridone', 'organic pigment', 'automotive'],
    technicalKeywords: ['PR122', 'quinacridone', 'QR122', 'magenta'],
    variants: [
      { size: '5 kg',  sku: 'QR-122-005', packagingType: 'bag', price: 520, stock: 80 },
      { size: '25 kg', sku: 'QR-122-025', packagingType: 'bag', price: 2400, stock: 70 },
    ],
    images: [{ url: '/products/qr-122.jpg', alt: 'Quinacridone Magenta QR-122', isPrimary: true }],
  },

  // ── Inorganic Pigments ────────────────────────────────────
  {
    title: 'Iron Oxide Red 130',
    category: catMap['Inorganic Pigments'],
    description: 'Synthetic iron oxide red pigment offering outstanding UV resistance, chemical stability, and compatibility with all coating systems.',
    applications: ['Architectural coatings', 'Concrete colouring', 'Primers', 'Roof coatings'],
    industriesServed: ['Construction', 'Coatings', 'Infrastructure'],
    keyFeatures: ['Excellent UV stability', 'Alkali-resistant', 'Non-bleeding', 'Excellent hiding power'],
    technicalSpecifications: { pigmentIndex: 'PR 101', casNumber: '1309-37-1', oilAbsorption: '20–30 g/100g', density: '5.1 g/cm³' },
    price: 65, stock: 2000, isActive: true, isRestricted: false,
    pigmentType: 'Iron Oxide', casNumber: '1309-37-1',
    tags: ['red', 'iron oxide', 'inorganic', 'construction'],
    technicalKeywords: ['PR101', 'iron oxide red', 'synthetic iron oxide', 'Fe2O3'],
    variants: [
      { size: '25 kg',    sku: 'IOR-130-025', packagingType: 'bag', price: 65,   stock: 1000 },
      { size: '1000 kg',  sku: 'IOR-130-IBC', packagingType: 'ibc', price: 2400, stock: 1000 },
    ],
    images: [{ url: '/products/ior-130.jpg', alt: 'Iron Oxide Red 130', isPrimary: true }],
  },
  {
    title: 'Titanium Dioxide Rutile R-902',
    category: catMap['Inorganic Pigments'],
    description: 'Premium rutile grade TiO₂ for maximum whiteness and opacity in architectural and industrial coatings.',
    applications: ['Decorative paints', 'Industrial coatings', 'Plastics', 'Paper'],
    industriesServed: ['Coatings', 'Plastics', 'Paper & Packaging'],
    keyFeatures: ['Highest whiteness index', 'Superior opacity', 'Photocatalytic stability', 'Low oil absorption'],
    technicalSpecifications: { pigmentIndex: 'PW 6', casNumber: '13463-67-7', TiO2Content: '≥94%', pH: '6.5–8.5' },
    price: 420, stock: 1500, isActive: true, isRestricted: false,
    pigmentType: 'Titanium Dioxide', casNumber: '13463-67-7',
    tags: ['white', 'titanium dioxide', 'TiO2', 'rutile'],
    technicalKeywords: ['PW6', 'titanium dioxide', 'rutile', 'R902', 'TiO2'],
    variants: [
      { size: '25 kg',   sku: 'TDR-902-025', packagingType: 'bag', price: 420,   stock: 800 },
      { size: '1000 kg', sku: 'TDR-902-IBC', packagingType: 'ibc', price: 16500, stock: 700 },
    ],
    images: [{ url: '/products/tdr-902.jpg', alt: 'Titanium Dioxide Rutile R-902', isPrimary: true }],
  },
  {
    title: 'Carbon Black N330',
    category: catMap['Inorganic Pigments'],
    description: 'High-structure furnace carbon black for rubber reinforcement, pigmentation in coatings, and UV protection in plastics.',
    applications: ['Rubber compounding', 'Black coatings', 'Plastics UV protection'],
    industriesServed: ['Rubber', 'Coatings', 'Plastics', 'Automotive'],
    keyFeatures: ['High structure', 'Excellent conductivity', 'UV protection', 'Deep black colour'],
    technicalSpecifications: { pigmentIndex: 'PBk 7', casNumber: '1333-86-4', iodineAdsorption: '82 g/kg', DBP: '102 mL/100g' },
    price: 55, stock: 3000, isActive: true, isRestricted: false,
    pigmentType: 'Carbon Black', casNumber: '1333-86-4',
    tags: ['black', 'carbon black', 'N330', 'rubber'],
    technicalKeywords: ['PBk7', 'carbon black', 'N330', 'furnace black'],
    variants: [
      { size: '25 kg',   sku: 'CB-N330-025', packagingType: 'bag', price: 55,   stock: 1500 },
      { size: '1000 kg', sku: 'CB-N330-IBC', packagingType: 'ibc', price: 2100, stock: 1500 },
    ],
    images: [{ url: '/products/cb-n330.jpg', alt: 'Carbon Black N330', isPrimary: true }],
  },

  // ── Fluorescent Pigments ──────────────────────────────────
  {
    title: 'Fluorescent Red FR-22',
    category: catMap['Fluorescent Pigments'],
    description: 'Brilliant daylight fluorescent red pigment for safety markings, signage, and high-visibility coatings.',
    applications: ['Safety signage', 'Traffic marking', 'Fluorescent inks', 'Decorative coatings'],
    industriesServed: ['Safety & Signage', 'Printing', 'Coatings'],
    keyFeatures: ['Daylight fluorescence', 'High brightness', 'Compatible with UV-cure systems', 'Good weatherability'],
    technicalSpecifications: { heatStability: '180°C', particle_size: 'D50 ≤ 5 μm' },
    price: 320, stock: 200, isActive: true, isRestricted: false,
    pigmentType: 'Fluorescent',
    tags: ['fluorescent', 'red', 'safety', 'signage'],
    technicalKeywords: ['fluorescent red', 'daylight fluorescent', 'FR22'],
    variants: [
      { size: '5 kg',  sku: 'FLR-22-005', packagingType: 'bucket', price: 320,  stock: 100 },
      { size: '25 kg', sku: 'FLR-22-025', packagingType: 'bag',    price: 1450, stock: 100 },
    ],
    images: [{ url: '/products/flr-22.jpg', alt: 'Fluorescent Red FR-22', isPrimary: true }],
  },
  {
    title: 'Fluorescent Yellow FY-10',
    category: catMap['Fluorescent Pigments'],
    description: 'Brilliant daylight fluorescent yellow-green pigment for hi-vis workwear, road markings, and signage.',
    applications: ['Hi-vis workwear coatings', 'Road markings', 'Safety signage', 'Inks'],
    industriesServed: ['Safety & Signage', 'Printing', 'Apparel'],
    keyFeatures: ['Maximum visibility', 'Good chemical resistance', 'Wide application compatibility'],
    technicalSpecifications: { heatStability: '180°C', particle_size: 'D50 ≤ 5 μm' },
    price: 295, stock: 300, isActive: true, isRestricted: false,
    pigmentType: 'Fluorescent',
    tags: ['fluorescent', 'yellow', 'hi-vis', 'safety'],
    technicalKeywords: ['fluorescent yellow', 'FY10', 'hi-vis yellow', 'daylight fluorescent'],
    variants: [
      { size: '5 kg',  sku: 'FLY-10-005', packagingType: 'bucket', price: 295,  stock: 150 },
      { size: '25 kg', sku: 'FLY-10-025', packagingType: 'bag',    price: 1350, stock: 150 },
    ],
    images: [{ url: '/products/fly-10.jpg', alt: 'Fluorescent Yellow FY-10', isPrimary: true }],
  },

  // ── Alkyd Resins ──────────────────────────────────────────
  {
    title: 'Long Oil Alkyd Resin LO-65',
    category: catMap['Alkyd Resins'],
    description: 'Air-drying long oil alkyd resin for decorative exterior coatings with excellent gloss and flexibility.',
    applications: ['Gloss enamels', 'Exterior wood coatings', 'Metal primers', 'General industrial coatings'],
    industriesServed: ['Coatings', 'Construction', 'Furniture'],
    keyFeatures: ['Air-drying', 'Excellent gloss retention', 'Good flexibility', 'Compatible with driers'],
    technicalSpecifications: { oilLength: '65%', solidContent: '80±2%', viscosity: 'Z4–Z6 (Gardner)', acidValue: '≤10 mg KOH/g' },
    price: 95, stock: 5000, isActive: true, isRestricted: true,
    resinType: 'Alkyd',
    tags: ['alkyd', 'long oil', 'air-drying', 'resin'],
    technicalKeywords: ['LO65', 'long oil alkyd', 'air dry alkyd'],
    variants: [
      { size: '200 L drum', sku: 'LO-65-200', packagingType: 'drum', price: 3800,  stock: 2500 },
      { size: 'IBC 1000 L', sku: 'LO-65-IBC', packagingType: 'ibc',  price: 18500, stock: 2500 },
    ],
    images: [{ url: '/products/lo-65.jpg', alt: 'Long Oil Alkyd Resin LO-65', isPrimary: true }],
  },
  {
    title: 'Short Oil Alkyd Resin SO-35',
    category: catMap['Alkyd Resins'],
    description: 'Fast-drying short oil alkyd resin for industrial baking enamels and stoving lacquers.',
    applications: ['Baking enamels', 'Stoving lacquers', 'Industrial refinish'],
    industriesServed: ['Automotive', 'Industrial', 'Appliances'],
    keyFeatures: ['Fast cure at elevated temperature', 'Hard film', 'Good chemical resistance'],
    technicalSpecifications: { oilLength: '35%', solidContent: '60±2%', viscosity: 'U–W (Gardner)', acidValue: '≤12 mg KOH/g' },
    price: 85, stock: 3000, isActive: true, isRestricted: true,
    resinType: 'Alkyd',
    tags: ['alkyd', 'short oil', 'stoving', 'baking enamel'],
    technicalKeywords: ['SO35', 'short oil alkyd', 'stoving alkyd', 'bake dry'],
    variants: [
      { size: '200 L drum', sku: 'SO-35-200', packagingType: 'drum', price: 3400,  stock: 1500 },
      { size: 'IBC 1000 L', sku: 'SO-35-IBC', packagingType: 'ibc',  price: 16500, stock: 1500 },
    ],
    images: [{ url: '/products/so-35.jpg', alt: 'Short Oil Alkyd Resin SO-35', isPrimary: true }],
  },

  // ── Epoxy Resins ──────────────────────────────────────────
  {
    title: 'Bisphenol-A Epoxy Resin EP-828',
    category: catMap['Epoxy Resins'],
    description: 'Standard liquid epoxy resin based on Bisphenol-A. The industry reference for high-performance protective coatings, adhesives, and civil engineering.',
    applications: ['Protective coatings', 'Marine primers', 'Floor coatings', 'Structural adhesives'],
    industriesServed: ['Marine', 'Construction', 'Oil & Gas', 'Infrastructure'],
    keyFeatures: ['Low viscosity', 'Excellent adhesion', 'Chemical resistance', 'High strength'],
    technicalSpecifications: { epoxyEquivalentWeight: '185–192 g/eq', viscosity: '11000–14000 mPa·s at 25°C', density: '1.17 g/cm³' },
    price: 185, stock: 3000, isActive: true, isRestricted: true,
    resinType: 'Epoxy', casNumber: '25068-38-6', chemicalFormula: 'C21H24O4',
    tags: ['epoxy', 'BPA', 'EP828', 'liquid epoxy'],
    technicalKeywords: ['EP828', 'bisphenol A epoxy', 'liquid epoxy resin', 'EEW 188'],
    variants: [
      { size: '200 kg drum', sku: 'EP-828-200', packagingType: 'drum', price: 7400,  stock: 1500 },
      { size: 'IBC 1000 kg', sku: 'EP-828-IBC', packagingType: 'ibc',  price: 36000, stock: 1500 },
    ],
    images: [{ url: '/products/ep-828.jpg', alt: 'Bisphenol-A Epoxy Resin EP-828', isPrimary: true }],
  },
  {
    title: 'Amine Curing Agent AEP-300',
    category: catMap['Epoxy Resins'],
    description: 'Polyamine-based curing agent for room-temperature cure of standard and modified epoxy systems.',
    applications: ['Floor coatings', 'Grouts', 'Marine coatings', 'Civil engineering'],
    industriesServed: ['Construction', 'Marine', 'Infrastructure'],
    keyFeatures: ['Room-temperature cure', 'Low blush', 'Good chemical resistance', 'Compatible with EP-828'],
    technicalSpecifications: { aminValue: '350–400 mg KOH/g', viscosity: '50–100 mPa·s at 25°C', density: '0.97 g/cm³' },
    price: 145, stock: 2000, isActive: true, isRestricted: true,
    resinType: 'Epoxy Hardener',
    tags: ['epoxy', 'hardener', 'curing agent', 'amine'],
    technicalKeywords: ['AEP300', 'amine hardener', 'epoxy curing agent', 'polyamine'],
    variants: [
      { size: '25 kg',    sku: 'AEP-300-025', packagingType: 'drum', price: 3625,  stock: 1000 },
      { size: '200 kg',   sku: 'AEP-300-200', packagingType: 'drum', price: 29000, stock: 1000 },
    ],
    images: [{ url: '/products/aep-300.jpg', alt: 'Amine Curing Agent AEP-300', isPrimary: true }],
  },

  // ── Coating Additives ─────────────────────────────────────
  {
    title: 'Silicone Defoamer DF-201',
    category: catMap['Coating Additives'],
    description: 'Silicone-based defoamer and air-release additive for water-borne and solvent-borne coatings.',
    applications: ['Water-borne coatings', 'Industrial paints', 'Adhesives'],
    industriesServed: ['Coatings', 'Adhesives', 'Construction'],
    keyFeatures: ['Efficient foam suppression', 'Good compatibility', 'Low dosage effective'],
    technicalSpecifications: { activeContent: '100%', appearance: 'Clear to slightly hazy liquid', dosage: '0.05–0.5% by weight' },
    price: 245, stock: 800, isActive: true, isRestricted: false,
    tags: ['defoamer', 'silicone', 'additive'],
    technicalKeywords: ['DF201', 'defoamer', 'antifoam', 'silicone defoamer'],
    variants: [
      { size: '25 kg',  sku: 'DF-201-025', packagingType: 'drum', price: 245,  stock: 400 },
      { size: '200 kg', sku: 'DF-201-200', packagingType: 'drum', price: 1900, stock: 400 },
    ],
    images: [{ url: '/products/df-201.jpg', alt: 'Silicone Defoamer DF-201', isPrimary: true }],
  },
  {
    title: 'Wetting & Dispersing Agent WD-104',
    category: catMap['Coating Additives'],
    description: 'Polymeric wetting and dispersing agent for pigment and filler stabilisation in aqueous and solvent-borne coatings.',
    applications: ['Pigment grinding', 'Colour concentrates', 'Aqueous coatings', 'Solvent-borne coatings'],
    industriesServed: ['Coatings', 'Printing', 'Plastics'],
    keyFeatures: ['Excellent colour development', 'Prevents flocculation', 'Compatible with all pigment types'],
    technicalSpecifications: { activeContent: '40%', solvent: 'Water', pH: '7.0–8.5', dosage: '0.5–4% based on pigment' },
    price: 185, stock: 600, isActive: true, isRestricted: false,
    tags: ['dispersant', 'wetting agent', 'additive', 'pigment'],
    technicalKeywords: ['WD104', 'dispersing agent', 'wetting agent', 'polymeric dispersant'],
    variants: [
      { size: '25 kg',  sku: 'WD-104-025', packagingType: 'drum', price: 185,  stock: 300 },
      { size: '200 kg', sku: 'WD-104-200', packagingType: 'drum', price: 1450, stock: 300 },
    ],
    images: [{ url: '/products/wd-104.jpg', alt: 'Wetting & Dispersing Agent WD-104', isPrimary: true }],
  },
];

// HERO SLIDES — mirrors existing hero.seed.js but reads URI from .env
const heroData = [
  { title: 'Premium Industrial Chemical Solutions',     description: 'High-performance pigments, resins and specialty materials engineered for modern industry.',          ctaText: 'Browse Products',        ctaLink: '/products', largeImage: '/hero/slide1-lg.jpg',  mobileImage: '/hero/slide1-sm.jpg',  textBgColor: '#1E3A8A', order: 1,  isActive: true },
  { title: 'Advanced Pigment Technology',               description: 'Durable, vibrant pigments designed for coatings and plastics.',                                      ctaText: 'Explore Pigments',       ctaLink: '/products', largeImage: '/hero/slide2-lg.jpg',  mobileImage: '/hero/slide2-sm.jpg',  textBgColor: '#7C3AED', order: 2,  isActive: true },
  { title: 'High-Performance Resin Systems',            description: 'Industrial-grade resins optimized for durability and chemical resistance.',                          ctaText: 'View Resins',            ctaLink: '/products', largeImage: '/hero/slide3-lg.jpg',  mobileImage: '/hero/slide3-sm.jpg',  textBgColor: '#06B6D4', order: 3,  isActive: true },
  { title: 'Fluorescent & Specialty Pigments',          description: 'Bright, reliable pigment systems for demanding environments.',                                       ctaText: 'Discover More',          ctaLink: '/products', largeImage: '/hero/slide4-lg.jpg',  mobileImage: '/hero/slide4-sm.jpg',  textBgColor: '#10B981', order: 4,  isActive: true },
  { title: 'Industrial Coatings & Additives',           description: 'Enhance product performance with precision-engineered additives.',                                   ctaText: 'See Solutions',          ctaLink: '/products', largeImage: '/hero/slide5-lg.jpg',  mobileImage: '/hero/slide5-sm.jpg',  textBgColor: '#F59E0B', order: 5,  isActive: true },
  { title: 'Sustainable Chemical Innovation',           description: 'Environment-conscious formulations supporting industrial growth.',                                   ctaText: 'Learn More',             ctaLink: '/about',    largeImage: '/hero/slide6-lg.jpg',  mobileImage: '/hero/slide6-sm.jpg',  textBgColor: '#EC4899', order: 6,  isActive: true },
  { title: 'Global Supply Network',                     description: 'Reliable sourcing and distribution across Africa and beyond.',                                       ctaText: 'Our Distribution',       ctaLink: '/about',    largeImage: '/hero/slide7-lg.jpg',  mobileImage: '/hero/slide7-sm.jpg',  textBgColor: '#4F46E5', order: 7,  isActive: true },
  { title: 'Technical Documentation Access',            description: 'Secure SDS sheets and product specifications for registered clients.',                               ctaText: 'Create Account',         ctaLink: '/register', largeImage: '/hero/slide8-lg.jpg',  mobileImage: '/hero/slide8-sm.jpg',  textBgColor: '#14B8A6', order: 8,  isActive: true },
  { title: 'Customized Industrial Formulations',        description: 'Tailored chemical solutions designed for your operations.',                                          ctaText: 'Request Consultation',   ctaLink: '/contact',  largeImage: '/hero/slide9-lg.jpg',  mobileImage: '/hero/slide9-sm.jpg',  textBgColor: '#F97316', order: 9,  isActive: true },
  { title: 'Partner With MukonoTalks',           description: 'Delivering performance, color and industrial reliability.',                                          ctaText: 'Get in Touch',           ctaLink: '/contact',  largeImage: '/hero/slide10-lg.jpg', mobileImage: '/hero/slide10-sm.jpg', textBgColor: '#6366F1', order: 10, isActive: true },
];

// CMS PAGES
const pagesData = [
  {
    pageKey: 'about',
    localizedSlug: { en: 'about', zh: null, sw: null },
    title: { en: 'About MukonoTalks', zh: null, sw: null },
    contentBlocks: [
      { type: 'text', order: 0, data: { en: { heading: 'Who We Are',   body: 'MukonoTalks is a leading B2B supplier of industrial pigments, resins, and specialty chemicals across Africa. Founded with a commitment to quality, innovation, and reliability, we serve manufacturers, distributors, and contractors across the continent.' }, zh: null, sw: null } },
      { type: 'text', order: 1, data: { en: { heading: 'Our Mission',  body: 'To empower African industry with access to world-class chemical solutions at competitive prices, backed by uncompromising technical support.' }, zh: null, sw: null } },
      { type: 'text', order: 2, data: { en: { heading: 'Our Values',   body: 'Quality, Integrity, Innovation, and Partnership. These four pillars guide every interaction — from product formulation to after-sale technical support.' }, zh: null, sw: null } },
    ],
    seo: {
      en: { title: 'About Us | MukonoTalks', description: "Learn about MukonoTalks — Africa's trusted B2B industrial chemical supplier." },
      zh: {}, sw: {},
    },
    publishStatus: 'published',
    publishedAt: new Date(),
  },
  {
    pageKey: 'contact',
    localizedSlug: { en: 'contact', zh: null, sw: null },
    title: { en: 'Contact Us', zh: null, sw: null },
    contentBlocks: [
      { type: 'text', order: 0, data: { en: { heading: 'Get in Touch', body: 'Have a procurement enquiry, technical question, or partnership proposal? Our team is ready to assist you.', email: 'info@mukonotalks.ug', phone: '+27 11 000 0000', address: '12 Industrial Drive, Johannesburg, Gauteng, 2000, South Africa' }, zh: null, sw: null } },
    ],
    seo: {
      en: { title: 'Contact Us | MukonoTalks', description: 'Reach our sales and technical team.' },
      zh: {}, sw: {},
    },
    publishStatus: 'published',
    publishedAt: new Date(),
  },
  {
    pageKey: 'privacy-policy',
    localizedSlug: { en: 'privacy-policy', zh: null, sw: null },
    title: { en: 'Privacy Policy', zh: null, sw: null },
    contentBlocks: [
      { type: 'text', order: 0, data: { en: { heading: 'Your Privacy Matters', body: 'MukonoTalks is committed to protecting your personal information in accordance with the Protection of Personal Information Act (POPIA) and applicable data protection legislation.' }, zh: null, sw: null } },
      { type: 'text', order: 1, data: { en: { heading: 'Data We Collect',       body: 'We collect company name, contact details, and order history to provide our B2B services. We do not sell your data to third parties.' }, zh: null, sw: null } },
    ],
    seo: {
      en: { title: 'Privacy Policy | MukonoTalks', description: 'Our privacy policy and data protection practices.' },
      zh: {}, sw: {},
    },
    publishStatus: 'published',
    publishedAt: new Date(),
  },
  {
    pageKey: 'terms-and-conditions',
    localizedSlug: { en: 'terms-and-conditions', zh: null, sw: null },
    title: { en: 'Terms and Conditions', zh: null, sw: null },
    contentBlocks: [
      { type: 'text', order: 0, data: { en: { heading: 'Terms of Use', body: 'By accessing the MukonoTalks platform you agree to these terms. All transactions are subject to South African law. Products are sold for industrial use only and must comply with relevant environmental and safety regulations.' }, zh: null, sw: null } },
    ],
    seo: {
      en: { title: 'Terms & Conditions | MukonoTalks', description: 'Terms governing the use of the MukonoTalks B2B platform.' },
      zh: {}, sw: {},
    },
    publishStatus: 'published',
    publishedAt: new Date(),
  },
];

// ARTICLES
const articlesData = [
  {
    title: { en: 'Understanding Pigment Dispersion in Industrial Coatings', zh: null, sw: null },
    localizedSlug: { en: 'understanding-pigment-dispersion-industrial-coatings', zh: null, sw: null },
    excerpt: { en: 'A technical overview of wetting, dispersing, and stabilising pigments in modern solvent-borne and water-borne coatings systems.', zh: null, sw: null },
    category: 'knowledge-base',
    tags: ['pigments', 'dispersion', 'coatings', 'technical'],
    author: { name: 'Dr. S. Mokoena', role: 'Technical Director' },
    featuredImage: '/articles/pigment-dispersion.jpg',
    contentBlocks: [
      { type: 'text', order: 0, data: { en: { heading: 'Why Dispersion Matters', body: 'Poor pigment dispersion leads to flocculation, colour inconsistency, and reduced protective performance. Understanding the three-stage dispersion process — wetting, grinding, and stabilisation — is essential for any formulator.' }, zh: null, sw: null } },
      { type: 'text', order: 1, data: { en: { heading: 'Selecting the Right Dispersant', body: 'Polymeric dispersants (e.g., WD-104) provide steric stabilisation for both organic and inorganic pigments. The correct HLB value and acid/base chemistry of the dispersant must be matched to the pigment surface chemistry.' }, zh: null, sw: null } },
    ],
    seo: { en: { title: 'Pigment Dispersion Guide | MukonoTalks', description: 'Technical guide on pigment dispersion in coatings.' }, zh: {}, sw: {} },
    publishStatus: 'published',
    publishedAt: new Date(),
  },
  {
    title: { en: 'Epoxy vs Polyurethane: Choosing the Right System', zh: null, sw: null },
    localizedSlug: { en: 'epoxy-vs-polyurethane-choosing-right-system', zh: null, sw: null },
    excerpt: { en: 'A practical comparison of epoxy and polyurethane coating systems for industrial floor, marine, and structural applications.', zh: null, sw: null },
    category: 'blog',
    tags: ['epoxy', 'polyurethane', 'coatings', 'comparison'],
    author: { name: 'Lena van der Berg', role: 'Applications Specialist' },
    featuredImage: '/articles/epoxy-vs-pu.jpg',
    contentBlocks: [
      { type: 'text', order: 0, data: { en: { heading: 'Key Differences', body: 'Epoxy systems excel in adhesion, chemical resistance, and structural bonding. Polyurethane systems offer superior UV stability, flexibility, and abrasion resistance. The right choice depends on substrate, exposure conditions, and performance requirements.' }, zh: null, sw: null } },
      { type: 'text', order: 1, data: { en: { heading: 'Typical Applications', body: 'Use epoxy for immersed or chemical-exposure environments. Use PU topcoats where UV exposure and aesthetics are critical. Many high-performance systems combine both: epoxy primer + PU topcoat.' }, zh: null, sw: null } },
    ],
    seo: { en: { title: 'Epoxy vs Polyurethane Coatings | MukonoTalks', description: 'Compare epoxy and PU coating systems for industrial use.' }, zh: {}, sw: {} },
    publishStatus: 'published',
    publishedAt: new Date(),
  },
  {
    title: { en: 'Iron Oxide Pigments in Construction: A Complete Guide', zh: null, sw: null },
    localizedSlug: { en: 'iron-oxide-pigments-construction-guide', zh: null, sw: null },
    excerpt: { en: 'How synthetic iron oxides deliver colour, durability, and UV stability in concrete, renders, and architectural coatings.', zh: null, sw: null },
    category: 'knowledge-base',
    tags: ['iron oxide', 'construction', 'concrete', 'inorganic pigment'],
    author: { name: 'Dr. S. Mokoena', role: 'Technical Director' },
    featuredImage: '/articles/iron-oxide-construction.jpg',
    contentBlocks: [
      { type: 'text', order: 0, data: { en: { heading: 'Why Iron Oxides?', body: 'Synthetic iron oxide pigments (PR 101, PY 42, PBr 11) are alkali-resistant, UV-stable, and non-toxic — making them ideal for use in cement-based products. They remain stable at high pH values common in concrete and mortar.' }, zh: null, sw: null } },
    ],
    seo: { en: { title: 'Iron Oxide Pigments in Construction | MukonoTalks', description: 'Complete guide to using iron oxide pigments in construction applications.' }, zh: {}, sw: {} },
    publishStatus: 'published',
    publishedAt: new Date(),
  },
];

// ─── Import ────────────────────────────────────────────────────
const importData = async () => {
  try {
    await connectDB();

    // 1. Users (raw insert — passwords already hashed above to skip pre-save hook)
    await User.deleteMany({});
    const users = await buildUsers();
    await User.collection.insertMany(users);                   // bypass pre-save hook
    console.log(`✅  Users seeded: ${users.length}`);

    // 2. Categories
    await Category.deleteMany({});
    const insertedCats = await Category.insertMany(
      categoriesData.map((c) => ({
        ...c,
        slug: c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }))
    );
    const catMap = {};
    insertedCats.forEach((c) => { catMap[c.name] = c._id; });
    console.log(`✅  Categories seeded: ${insertedCats.length}`);

    // 3. Products
    await Product.deleteMany({});
    const products = buildProducts(catMap);
    await Product.insertMany(
      products.map((p) => ({
        ...p,
        slug: p.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }))
    );
    console.log(`✅  Products seeded: ${products.length}`);

    // 4. Hero slides
    await Hero.deleteMany({});
    await Hero.insertMany(heroData);
    console.log(`✅  Hero slides seeded: ${heroData.length}`);

    // 5. CMS Pages
    await Page.deleteMany({});
    await Page.insertMany(pagesData);
    console.log(`✅  Pages seeded: ${pagesData.length}`);

    // 6. Articles
    await Article.deleteMany({});
    await Article.insertMany(articlesData);
    console.log(`✅  Articles seeded: ${articlesData.length}`);

    console.log('\n🎉  Database ready!');
    console.log('─────────────────────────────────────────');
    console.log('Developer → developers@mukonotalks.ug / TrophyDev@R34567');
    console.log('Admin     → admin@mukonotalks.ug     / Admin@1234!');
    console.log('Customer  → jane@example-manufacturer.co.za / Customer@1234!');
    console.log('─────────────────────────────────────────');
  } catch (err) {
    console.error('❌  Seeder error:', err.message);
    if (err.message?.includes('ECONNREFUSED') || err.message?.includes('auth failed')) {
      console.error('    → Verify MONGO_URI in server/.env (Atlas: include user, password, cluster host)');
    }
    if (err.code === 11000) {
      console.error('    → Duplicate key — run with --destroy first to clear stale data');
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌  Connection closed');
    process.exit(0);
  }
};

// ─── Destroy ───────────────────────────────────────────────────
const destroyData = async () => {
  try {
    await connectDB();
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Hero.deleteMany({}),
      Page.deleteMany({}),
      Article.deleteMany({}),
      Document.deleteMany({}),
    ]);
    console.log('🗑️   All collections cleared');
  } catch (err) {
    console.error('❌  Destroy error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// ─── Entry ─────────────────────────────────────────────────────
if (process.argv.includes('--destroy')) {
  destroyData();
} else {
  importData();
}

