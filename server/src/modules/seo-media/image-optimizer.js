/**
 * Image SEO Service
 * Alt text generation, image analysis, filename optimization suggestions.
 * @module modules/image-seo/image-optimizer
 */

'use strict';

const path = require('path');

/**
 * Analyze an image URL for SEO issues.
 * @param {object} image - { url, alt, title }
 */
function analyzeImage(image = {}) {
  const issues = [];
  const suggestions = [];

  const url = image.url || '';
  const alt = image.alt || '';

  // Alt text checks
  if (!alt) {
    issues.push({ type: 'missing_alt', severity: 'error', message: 'Image is missing alt text.' });
    suggestions.push('Add a descriptive alt attribute that includes relevant keywords.');
  } else if (alt.length < 5) {
    issues.push({ type: 'alt_too_short', severity: 'warning', message: `Alt text "${alt}" is too short.` });
  } else if (alt.length > 125) {
    issues.push({ type: 'alt_too_long', severity: 'warning', message: 'Alt text exceeds 125 characters.' });
  }

  // Filename checks
  const filename = path.basename(url.split('?')[0]);
  const nameParts = filename.split('.');
  const ext  = nameParts.pop()?.toLowerCase();
  const name = nameParts.join('.');

  if (/^img\d*$|^image\d*$|^photo\d*$|^dsc_?\d+$/i.test(name)) {
    issues.push({ type: 'generic_filename', severity: 'warning', message: `Image filename "${filename}" is generic. Use descriptive names.` });
    suggestions.push(`Rename the file to something descriptive, e.g. "epoxy-resin-drum-product.jpg"`);
  }

  if (name.includes('_')) {
    suggestions.push(`Prefer hyphens over underscores in filenames: "${name.replace(/_/g, '-')}.${ext}"`);
  }

  if (ext && !['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg', 'gif'].includes(ext)) {
    issues.push({ type: 'unsupported_format', severity: 'warning', message: `Image format ".${ext}" may not be optimal for web.` });
  }

  return { url, alt, filename, issues, suggestions };
}

/**
 * Scan HTML content for all images and analyze them.
 */
function scanContentImages(html = '') {
  const imgRegex = /<img([^>]*)>/gi;
  const results  = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const attrs = match[1];
    const srcMatch  = attrs.match(/src=["']([^"']+)["']/i);
    const altMatch  = attrs.match(/alt=["']([^"']*)["']/i);
    const titleMatch = attrs.match(/title=["']([^"']*)["']/i);

    results.push(analyzeImage({
      url:   srcMatch?.[1]  || '',
      alt:   altMatch?.[1]  || '',
      title: titleMatch?.[1] || '',
    }));
  }

  return {
    total:      results.length,
    withAlt:    results.filter(r => r.alt).length,
    withoutAlt: results.filter(r => !r.alt).length,
    images:     results,
  };
}

/**
 * Generate SEO-optimized alt text suggestion from context.
 */
function generateAltSuggestion(filename = '', keywords = [], context = '') {
  // Strip file extension and replace separators
  const name = path.basename(filename).replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').toLowerCase();
  const kw   = keywords[0] || '';

  // Build suggestion from context or filename
  if (context) {
    return `${context}${kw ? ` - ${kw}` : ''}`.trim().slice(0, 120);
  }
  return `${name}${kw ? ` - ${kw}` : ''}`.trim().slice(0, 120);
}

/**
 * Optimize filename to SEO-friendly format.
 */
function optimizeFilename(filename = '') {
  const ext  = path.extname(filename).toLowerCase();
  const name = path.basename(filename, ext);
  const optimized = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${optimized}${ext}`;
}

module.exports = { analyzeImage, scanContentImages, generateAltSuggestion, optimizeFilename };

// MukonoTalks

