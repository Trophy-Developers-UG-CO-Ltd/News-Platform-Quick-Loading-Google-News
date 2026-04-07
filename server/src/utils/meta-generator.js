/**
 * Meta Generator
 * Utility to auto-generate SEO title and description from content/resource.
 * @module utils/meta-generator
 */

'use strict';

const seoConfig = require('../config/seo.config');

/**
 * Generate an SEO-optimized title.
 * @param {object} opts
 * @param {string} opts.resourceTitle  - The content/resource title
 * @param {string} [opts.siteName]     - Site name suffix
 * @param {string} [opts.separator]    - Separator between title and site name
 * @param {number} [opts.maxLength]    - Max title length (default 60)
 */
function generateTitle({ resourceTitle = '', siteName, separator = ' | ', maxLength = 60 } = {}) {
  const site   = siteName || seoConfig.siteName;
  const suffix = `${separator}${site}`;
  const avail  = maxLength - suffix.length;
  const title  = resourceTitle.slice(0, avail).trim();
  return `${title}${suffix}`;
}

/**
 * Generate a meta description from plain text content.
 * Strips HTML, normalizes whitespace, truncates to max length.
 * @param {string} text    - Raw content text or HTML
 * @param {number} maxLen  - Max description length (default 157)
 */
function generateDescription(text = '', maxLen = 157) {
  const stripped = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (stripped.length <= maxLen) return stripped;

  // Break at last complete word before maxLen
  const truncated = stripped.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${(lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim()}...`;
}

/**
 * Auto-populate missing SEO fields on a resource.
 * Returns an object of fields to apply to SeoMetadata.
 * @param {object} resource - Product, Article, Page, etc.
 * @param {string} pageType - 'product' | 'article' | 'page' | ...
 */
function autoPopulateMeta(resource = {}, pageType = 'page') {
  const title = typeof resource.title === 'object'
    ? resource.title.en || Object.values(resource.title)[0]
    : resource.title || resource.name || '';

  const descSource = typeof resource.description === 'object'
    ? resource.description.en || ''
    : resource.description || resource.excerpt || resource.summary || '';

  const slug = typeof resource.slug === 'object'
    ? resource.slug.en
    : resource.slug || resource.localizedSlug?.en || '';

  const canonicalPath = pageType === 'product'  ? `/products/${slug}`
                      : pageType === 'article'  ? `/articles/${slug}`
                      : pageType === 'category' ? `/categories/${slug}`
                      : pageType === 'page'     ? `/${slug}`
                      : `/${slug}`;

  return {
    title:           generateTitle({ resourceTitle: title }),
    metaDescription: generateDescription(descSource),
    canonical:       `${seoConfig.siteUrl}${canonicalPath}`,
    pageType,
    openGraph: {
      title:       title,
      description: generateDescription(descSource, 200),
      image:       resource.coverImage || resource.images?.[0] || '',
      type:        pageType === 'article' ? 'article' : 'website',
    },
    twitter: {
      card:        'summary_large_image',
      title:       title,
      description: generateDescription(descSource, 200),
      image:       resource.coverImage || resource.images?.[0] || '',
    },
  };
}

module.exports = { generateTitle, generateDescription, autoPopulateMeta };

// MukonoTalks

