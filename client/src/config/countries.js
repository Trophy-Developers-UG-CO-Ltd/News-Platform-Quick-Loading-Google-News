/**
 * Programmatic SEO — Client-side country configuration
 *
 * This mirrors shared/countries.js for the React frontend (ESM).
 * Add new countries here to instantly generate new country SEO pages
 * for every product and application.
 *
 * @module config/countries
 */

export const SUPPORTED_COUNTRIES = [
  { slug: 'uganda',   label: 'Uganda' },
  { slug: 'kenya',    label: 'Kenya' },
  { slug: 'tanzania', label: 'Tanzania' },
  // Future expansion — uncomment to activate:
  // { slug: 'rwanda',       label: 'Rwanda' },
  // { slug: 'drc',          label: 'DRC' },
  // { slug: 'ethiopia',     label: 'Ethiopia' },
  // { slug: 'south-africa', label: 'South Africa' },
];

/** Flat array of valid country slug strings */
export const COUNTRY_SLUGS = SUPPORTED_COUNTRIES.map((c) => c.slug);

/** Return the display label for a country slug, or null if not found */
export function getCountryLabel(slug) {
  const country = SUPPORTED_COUNTRIES.find((c) => c.slug === slug?.toLowerCase());
  return country ? country.label : null;
}

/** Return true when the given slug matches a supported country */
export function isValidCountry(slug) {
  return COUNTRY_SLUGS.includes(slug?.toLowerCase());
}
