/**
 * Schema builders
 * Pure functions that return valid schema.org JSON-LD objects.
 * Each function returns null when required data is missing so callers can filter safely.
 *
 * All schemas are validated against schema.org specification and Google's Rich Results requirements.
 *
 * @module utils/schemaBuilders
 */

const SITE_NAME = 'MukonoTalks';
const BRAND_NAME = 'MukonoTalks';
const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BASE_URL) ||
  'https://mukonotalks.ug';

const getEmbeddableVideoUrl = (url) => {
  if (!url) return '';

  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return url;
};

// ─── Availability mapping ────────────────────────────────────────────────────
const AVAILABILITY_MAP = {
  in_stock:      'https://schema.org/InStock',
  made_to_order: 'https://schema.org/MadeToOrder',
  limited:       'https://schema.org/LimitedAvailability',
  discontinued:  'https://schema.org/Discontinued',
};

// ─── 1. Product schema ────────────────────────────────────────────────────────
/**
 * Build a complete schema.org/Product JSON-LD object.
 * Each resin, pigment or chemical material should use this schema.
 *
 * @param {object} product - MongoDB product document
 * @param {string} lang    - current language code
 * @returns {object|null}
 */
export const buildProductSchema = (product, lang = 'en') => {
  if (!product?._id) return null;

  const canonicalUrl = `${BASE_URL}/${lang}/products/${product.slug}`;
  const primaryImage  = product.images?.[0]?.url;
  const allImages     = [
    ...(product.images || []).map((i) => i.url).filter(Boolean),
    ...(product.gallery || []).map((g) => g.url).filter(Boolean),
  ];

  const schema = {
    '@context': 'https://schema.org',
    '@type':    'Product',
    name:        product.title,
    description: product.seoDescription || product.description?.substring(0, 500),
    url:         canonicalUrl,
  };

  if (allImages.length > 0) schema.image = allImages;
  if (product.category?.name) schema.category = product.category.name;

  // Brand
  schema.brand = {
    '@type': 'Brand',
    name: product.brand || BRAND_NAME,
  };

  // Manufacturer
  schema.manufacturer = {
    '@type': 'Organization',
    name: product.manufacturer || BRAND_NAME,
  };

  // Material
  if (product.material) schema.material = product.material;

  // Additional properties (schema.org/PropertyValue)
  const additionalProp = [];
  if (product.additionalProperty?.length > 0) {
    product.additionalProperty.forEach((p) => {
      additionalProp.push({
        '@type': 'PropertyValue',
        name:  p.name,
        value: p.value,
      });
    });
  }
  // Auto-derive from technical specs if no manual additionalProperty set
  if (additionalProp.length === 0 && product.technicalSpecifications) {
    Object.entries(product.technicalSpecifications)
      .slice(0, 10) // cap at 10 for schema size
      .forEach(([k, v]) => {
        additionalProp.push({
          '@type': 'PropertyValue',
          name:  k.replace(/([A-Z])/g, ' $1').trim(),
          value: String(v),
        });
      });
  }
  if (additionalProp.length > 0) schema.additionalProperty = additionalProp;

  // Offers / availability
  if (product.availability) {
    schema.offers = {
      '@type':        'Offer',
      availability:   AVAILABILITY_MAP[product.availability] || 'https://schema.org/InStock',
      priceCurrency:  product.priceCurrency || 'USD',
      seller: {
        '@type': 'Organization',
        name:    BRAND_NAME,
      },
    };
  }

  // Certifications
  if (product.certifications?.length > 0) {
    schema.hasCertification = product.certifications.map((c) => ({
      '@type': 'Certification',
      name: c.name,
      ...(c.body ? { issuedBy: { '@type': 'Organization', name: c.body } } : {}),
      ...(c.number ? { certificationIdentification: c.number } : {}),
    }));
  }

  return schema;
};

// ─── 2. BreadcrumbList schema ─────────────────────────────────────────────────
/**
 * Build a schema.org/BreadcrumbList.
 * Critical for SERP navigation appearance.
 *
 * @param {{ name: string, url?: string }[]} items
 * @returns {object|null}
 */
export const buildBreadcrumbSchema = (items) => {
  if (!items?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type':    'ListItem',
      position:   i + 1,
      name:       item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
};

// ─── 3. FAQPage schema ────────────────────────────────────────────────────────
/**
 * Build a schema.org/FAQPage json-ld object.
 * Triggers Google rich result FAQ accordion in SERPs.
 *
 * @param {{ question: string, answer: string }[]} faqs
 * @returns {object|null}
 */
export const buildFAQSchema = (faqs) => {
  if (!faqs?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type':    'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name:    f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text:    f.answer,
      },
    })),
  };
};

// ─── 4. DigitalDocument schema ────────────────────────────────────────────────
/**
 * Build schema.org/DigitalDocument objects for product documents (SDS/TDS).
 * Improves document indexing in Google.
 *
 * @param {object[]} documents   - product.documents array
 * @param {string}   productName - used in the "about" field
 * @returns {object[]|null}
 */
export const buildDocumentSchemas = (documents, productName) => {
  if (!documents?.length) return null;
  return documents
    .filter((d) => !d.isRestricted && d.url)
    .map((d) => ({
      '@context': 'https://schema.org',
      '@type':    'DigitalDocument',
      name:       d.title,
      encodingFormat:
        d.fileType === 'pdf'  ? 'application/pdf'       :
        d.fileType === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
        d.fileType === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
        'application/octet-stream',
      url: d.url,
      ...(productName
        ? { about: { '@type': 'Product', name: productName } }
        : {}),
    }));
};

// ─── 5. VideoObject schema ────────────────────────────────────────────────────
/**
 * Build schema.org/VideoObject objects for product videos.
 *
 * @param {object[]} videos    - product.videos array
 * @param {string}   thumbnail - fallback thumbnail URL
 * @returns {object[]|null}
 */
export const buildVideoSchemas = (videos, thumbnail) => {
  if (!videos?.length) return null;
  return videos
    .filter((v) => v.url)
    .map((v) => ({
      '@context':    'https://schema.org',
      '@type':       'VideoObject',
      name:          v.title          || 'Product Video',
      description:   v.description    || '',
      thumbnailUrl:  thumbnail        || '',
      uploadDate:    new Date().toISOString().split('T')[0],
      contentUrl:    v.url,
    }));
};

// ─── 6. CollectionPage schema (Category/Products listing page) ────────────────
/**
 * Build a schema.org/CollectionPage for product category/listing pages.
 *
 * @param {{ name: string, description: string, url: string }} data
 * @returns {object}
 */
export const buildCollectionPageSchema = ({ name, description, url }) => ({
  '@context':  'https://schema.org',
  '@type':     'CollectionPage',
  name,
  description,
  url,
  publisher: {
    '@type': 'Organization',
    name:    BRAND_NAME,
  },
});

// ─── 7. Organization schema ───────────────────────────────────────────────────
/**
 * Build a schema.org/Organization with the given data object.
 * Accepts the raw schemaData from the SEO model so admin edits are reflected.
 *
 * @param {object} schemaData - from seo/organization schemaData
 * @returns {object}
 */
export const buildOrganizationSchema = (schemaData) =>
  schemaData || {
    '@context': 'https://schema.org',
    '@type':    'Organization',
    name:        BRAND_NAME,
    url:         BASE_URL,
  };

// ─── 8. WebSite / Sitelinks Searchbox ────────────────────────────────────────
/**
 * Build a schema.org/WebSite with Sitelinks Searchbox.
 *
 * @param {string}  lang
 * @returns {object}
 */
export const buildWebSiteSchema = (lang = 'en') => ({
  '@context': 'https://schema.org',
  '@type':    'WebSite',
  name:        SITE_NAME,
  url:         BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type':     'EntryPoint',
      urlTemplate: `${BASE_URL}/${lang}/products?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

// ─── 9. Article / BlogPosting schema ─────────────────────────────────────────
/**
 * Build a schema.org/Article (or BlogPosting) for article pages.
 *
 * @param {object} article
 * @param {string} lang
 * @returns {object|null}
 */
export const buildArticleSchema = (article, lang = 'en') => {
  if (!article?._id) return null;
  const canonicalUrl = `${BASE_URL}/${String(article.category || 'general').trim().toLowerCase()}/${article.slug}`;
  const primaryImage  = article.coverImage?.url || article.featuredImage;

  return {
    '@context':       'https://schema.org',
    '@type':          article.category === 'blog' ? 'BlogPosting' : 'Article',
    headline:          article.title,
    description:       article.summary || article.title,
    url:               canonicalUrl,
    datePublished:     article.publishedAt || article.createdAt,
    dateModified:      article.updatedAt   || article.publishedAt,
    ...(primaryImage ? { image: primaryImage } : {}),
    author: {
      '@type': 'Organization',
      name:    BRAND_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name:    BRAND_NAME,
      logo: {
        '@type': 'ImageObject',
        url:     `${BASE_URL}/logo.png`,
      },
    },
    ...(article.tags?.length ? { keywords: article.tags.join(', ') } : {}),
  };
};

export const buildArticleVideoSchema = (article) => {
  if (!article?._id || !article?.videoMeta?.enabled) return null;

  const primaryUrl =
    article.videoMeta.directVideoUrl ||
    article.videoMeta.videoUrl ||
    article.videoMeta.embedUrl;

  if (!primaryUrl) return null;

  const embedUrl = article.videoMeta.embedUrl || getEmbeddableVideoUrl(primaryUrl);
  const thumbnailUrl =
    article.videoMeta.thumbnailUrl ||
    article.videoMeta.posterImage ||
    article.featuredImage ||
    '';

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: article.title || 'MukonoTalks Video',
    description: article.seo?.description || article.excerpt || article.title || '',
    thumbnailUrl,
    uploadDate: article.videoMeta.uploadDate || article.publishedAt || article.createdAt,
    ...(article.videoMeta.duration ? { duration: article.videoMeta.duration } : {}),
    ...(article.videoMeta.directVideoUrl ? { contentUrl: article.videoMeta.directVideoUrl } : {}),
    ...(embedUrl ? { embedUrl } : {}),
  };
};

// ─── 10. DefinedTerm schema (Industrial Application pages) ────────────────────
/**
 * Build a schema.org/DefinedTerm for industry/application specific pages.
 *
 * @param {{ name: string, description: string, termSet?: string }} data
 * @returns {object}
 */
export const buildDefinedTermSchema = ({ name, description, termSet = 'Industrial Chemical Applications' }) => ({
  '@context': 'https://schema.org',
  '@type':    'DefinedTerm',
  name,
  description,
  inDefinedTermSet: termSet,
});

// MukonoTalks

