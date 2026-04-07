/**
 * Keyword Analysis Engine
 * Analyzes keyword density, placement, and distribution in content.
 * @module modules/seo-analyzer/keyword.engine
 */

'use strict';

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Normalize text: lowercase, strip HTML, strip punctuation.
 */
function normalizeText(text = '') {
  return text
    .replace(/<[^>]+>/g, ' ')         // strip HTML
    .replace(/[^\w\s]/g, ' ')         // strip punctuation
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Count how many times keyword appears in text.
 */
function countKeyword(text, keyword) {
  if (!keyword || !text) return 0;
  const normalized = normalizeText(keyword);
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Total word count in text (stripped of HTML).
 */
function wordCount(text = '') {
  const stripped = normalizeText(text);
  if (!stripped) return 0;
  return stripped.split(/\s+/).filter(Boolean).length;
}

/**
 * Check if text starts with or contains keyword in first sentence.
 */
function keywordInFirstSentence(text, keyword) {
  const stripped = normalizeText(text);
  const firstSentence = stripped.split(/[.!?]/)[0] || '';
  return firstSentence.includes(normalizeText(keyword));
}

/**
 * Check keyword presence in heading tags.
 */
function keywordInHeadings(html, keyword) {
  const headingRegex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi;
  const matches = [];
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    matches.push(match[1].replace(/<[^>]+>/g, '').toLowerCase());
  }
  const kw = keyword.toLowerCase();
  return matches.some(h => h.includes(kw));
}

/**
 * Check keyword in image alt attributes.
 */
function keywordInImageAlts(html, keyword) {
  const altRegex = /alt=["']([^"']*)["']/gi;
  const kw = keyword.toLowerCase();
  let match;
  while ((match = altRegex.exec(html)) !== null) {
    if (match[1].toLowerCase().includes(kw)) return true;
  }
  return false;
}

/**
 * Count H1–H6 tags present in HTML.
 */
function extractHeadings(html) {
  const result = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
  for (let i = 1; i <= 6; i++) {
    const regex = new RegExp(`<h${i}[^>]*>`, 'gi');
    const matches = html.match(regex);
    result[`h${i}`] = matches ? matches.length : 0;
  }
  return result;
}

/**
 * Count internal vs external links in HTML.
 * @param {string} html
 * @param {string} siteUrl - base site URL (e.g. https://example.com)
 */
function countLinks(html, siteUrl = '') {
  const linkRegex = /href=["']([^"']+)["']/gi;
  let internal = 0, external = 0;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith('/') || (siteUrl && href.startsWith(siteUrl))) {
      internal++;
    } else if (href.startsWith('http') || href.startsWith('//')) {
      external++;
    }
  }
  return { internal, external };
}

/**
 * Count images and how many lack alt tags.
 */
function analyzeImages(html) {
  const imgRegex = /<img[^>]*>/gi;
  const altRegex = /alt=["'][^"']*["']/i;
  const imgs = html.match(imgRegex) || [];
  const withoutAlt = imgs.filter(img => !altRegex.test(img));
  return { total: imgs.length, withoutAlt: withoutAlt.length };
}

// ─── Keyword Density Analyzer ─────────────────────────────────

/**
 * Analyze focus keyword and secondary keywords in content.
 * @param {object} opts
 * @param {string} opts.content        - raw HTML or text content
 * @param {string} opts.title          - page title
 * @param {string} opts.metaDescription - meta description
 * @param {string[]} opts.focusKeywords
 * @param {string[]} opts.secondaryKeywords
 * @param {string} [opts.siteUrl]
 */
function analyzeKeywords({ content = '', title = '', metaDescription = '', focusKeywords = [], secondaryKeywords = [], siteUrl = '' }) {
  const plainText = normalizeText(content);
  const words     = wordCount(content);

  const results = [];

  const allKws = [...focusKeywords.map(k => ({ kw: k, type: 'focus' })),
                  ...secondaryKeywords.map(k => ({ kw: k, type: 'secondary' }))];

  for (const { kw, type } of allKws) {
    if (!kw) continue;
    const count   = countKeyword(plainText, kw);
    const density = words > 0 ? parseFloat(((count / words) * 100).toFixed(2)) : 0;
    const inTitle = title.toLowerCase().includes(kw.toLowerCase());
    const inDesc  = metaDescription.toLowerCase().includes(kw.toLowerCase());
    const inFirst = keywordInFirstSentence(content, kw);
    const inH1    = keywordInHeadings(content, kw);
    const inImg   = keywordInImageAlts(content, kw);

    let densityStatus = 'good';
    if (density < 0.5)  densityStatus = 'too_low';
    if (density > 2.5)  densityStatus = 'too_high';

    results.push({
      keyword:        kw,
      type,
      count,
      density,
      densityStatus,
      inTitle,
      inMetaDescription: inDesc,
      inFirstSentence: inFirst,
      inHeadings:     inH1,
      inImageAlt:     inImg,
    });
  }

  const headings = extractHeadings(content);
  const links    = countLinks(content, siteUrl);
  const images   = analyzeImages(content);

  return {
    wordCount: words,
    headings,
    links,
    images,
    keywords: results,
  };
}

module.exports = {
  analyzeKeywords,
  wordCount,
  extractHeadings,
  countLinks,
  analyzeImages,
  countKeyword,
};

// MukonoTalks

