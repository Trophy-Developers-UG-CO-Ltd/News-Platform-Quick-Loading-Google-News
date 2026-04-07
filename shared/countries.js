/**
 * Programmatic SEO — Supported country list
 *
 * Add new countries here to instantly enable country-specific SEO pages
 * for ALL products and applications without any other code changes.
 *
 * URL pattern:
 *   /products/{product-slug}/{country}
 *   /products/{product-slug}/application/{application-slug}/{country}
 *
 * @module shared/countries
 */

const SUPPORTED_COUNTRIES = [
  { slug: 'uganda',   label: 'Uganda' },
  { slug: 'kenya',    label: 'Kenya' },
  { slug: 'tanzania', label: 'Tanzania' },
  // Future expansion — uncomment to activate:
  // { slug: 'rwanda',       label: 'Rwanda' },
  // { slug: 'drc',          label: 'DRC' },
  // { slug: 'ethiopia',     label: 'Ethiopia' },
  // { slug: 'south-africa', label: 'South Africa' },
];

module.exports = { SUPPORTED_COUNTRIES };
