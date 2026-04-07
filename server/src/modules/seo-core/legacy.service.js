/**
 * SEO Schema service
 * Business logic for managing global structured-data schemas
 * @module modules/seo/seo.service
 */

const SeoSchema = require('./legacy.model');

// Default schemas seeded on first access
const DEFAULT_SCHEMAS = [
  {
    schemaKey: 'organization',
    label: 'Organization',
    description: 'Schema.org Organization — brand authority & E-E-A-T signals. Injected on every page.',
    isGlobal: true,
    isActive: true,
    schemaData: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'MukonoTalks Ltd',
      url: 'https://mukonotalks.ug',
      logo: 'https://mukonotalks.ug/logo.png',
      description:
        'Supplier of industrial pigments, polyester resins, ion exchange resins and specialty chemical materials for Africa and global markets.',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'UG',
        addressLocality: 'Kampala',
      },
      areaServed: ['Uganda', 'Kenya', 'Tanzania', 'China', 'Africa'],
      sameAs: [],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'sales',
        areaServed: 'AF',
        availableLanguage: ['English', 'Chinese'],
      },
    },
  },
  {
    schemaKey: 'website',
    label: 'WebSite',
    description: 'Schema.org WebSite with Sitelinks Searchbox support. Injected on the homepage.',
    isGlobal: false,
    isActive: true,
    schemaData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'MukonoTalks',
      url: 'https://mukonotalks.ug',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://mukonotalks.ug/en/products?search={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  },
  {
    schemaKey: 'products-collection',
    label: 'Products Collection Page',
    description: 'Schema.org CollectionPage for the main products listing. Injected on /products.',
    isGlobal: false,
    isActive: true,
    schemaData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Industrial Chemicals & Specialty Materials',
      description:
        'MukonoTalks product catalogue: ion exchange resins, polyester resins, industrial pigments, and chemical raw materials.',
      url: 'https://mukonotalks.ug/en/products',
      publisher: {
        '@type': 'Organization',
        name: 'MukonoTalks Ltd',
      },
    },
  },
];

/**
 * Ensure default schemas exist in the database (idempotent)
 */
const seedDefaults = async () => {
  for (const def of DEFAULT_SCHEMAS) {
    const exists = await SeoSchema.findOne({ schemaKey: def.schemaKey });
    if (!exists) await SeoSchema.create(def);
  }
};

/**
 * Get all schema records
 */
const getAllSchemas = async () => {
  await seedDefaults();
  return SeoSchema.find().sort({ isGlobal: -1, schemaKey: 1 }).lean();
};

/**
 * Get a single schema by key
 */
const getSchemaByKey = async (schemaKey) => {
  await seedDefaults();
  const doc = await SeoSchema.findOne({ schemaKey }).lean();
  if (!doc) {
    const err = new Error(`SEO schema "${schemaKey}" not found`);
    err.statusCode = 404;
    throw err;
  }
  return doc;
};

/**
 * Get all global (isGlobal: true, isActive: true) schemas
 */
const getGlobalSchemas = async () => {
  await seedDefaults();
  return SeoSchema.find({ isGlobal: true, isActive: true }).lean();
};

/**
 * Upsert a schema record (create or update by schemaKey)
 */
const upsertSchema = async (schemaKey, payload, userId) => {
  const update = {
    label: payload.label,
    description: payload.description,
    schemaData: payload.schemaData,
    isGlobal: payload.isGlobal !== undefined ? payload.isGlobal : undefined,
    isActive: payload.isActive !== undefined ? payload.isActive : undefined,
    updatedBy: userId,
  };

  // Remove undefined keys
  Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

  const doc = await SeoSchema.findOneAndUpdate(
    { schemaKey },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return doc;
};

/**
 * Delete a schema by key (non-default schemas only)
 */
const deleteSchema = async (schemaKey, userId) => {
  const defaultKeys = DEFAULT_SCHEMAS.map((d) => d.schemaKey);
  if (defaultKeys.includes(schemaKey)) {
    const err = new Error('Default schemas cannot be deleted — you may disable them instead.');
    err.statusCode = 400;
    throw err;
  }
  const doc = await SeoSchema.findOneAndDelete({ schemaKey });
  if (!doc) {
    const err = new Error(`SEO schema "${schemaKey}" not found`);
    err.statusCode = 404;
    throw err;
  }
  return { message: 'Schema deleted' };
};

module.exports = {
  getAllSchemas,
  getSchemaByKey,
  getGlobalSchemas,
  upsertSchema,
  deleteSchema,
  seedDefaults,
};

// MukonoTalks

