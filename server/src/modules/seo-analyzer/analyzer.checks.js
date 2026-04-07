/**
 * Analyzer Checks
 * Individual SEO check functions used by the main analyzer.
 * Each function returns { score, issues } for a specific aspect.
 * @module modules/seo-analyzer/analyzer.checks
 */

'use strict';

const seoConfig = require('../../config/seo.config');

const WEIGHTS = {
  titlePresent:       5, titleLength:         5, titleHasFocusKw:     5,
  descPresent:        5, descLength:          5, descHasFocusKw:      5,
  contentLength:     10, keywordDensity:     10, keywordInH1:         5,
  keywordInFirstPara: 5, headingStructure:    5, internalLinks:       5,
  imagesHaveAlt:      5, readability:        20, secondaryKeywords:   5,
};

function checkTitle(title, focusKeyword) {
  const issues = [];
  const len = title?.length ?? 0;
  let score = 0;
  if (!title) {
    issues.push({ type: 'title_missing', severity: 'error', message: 'No SEO title found.' });
    return { score, issues };
  }
  score += WEIGHTS.titlePresent;
  if (len < seoConfig.meta.titleMin) {
    issues.push({ type: 'title_too_short', severity: 'warning', message: `Title is ${len} chars; aim for ${seoConfig.meta.titleMin}–${seoConfig.meta.titleMax}.` });
  } else if (len > seoConfig.meta.titleMax) {
    issues.push({ type: 'title_too_long', severity: 'warning', message: `Title is ${len} chars; trim to under ${seoConfig.meta.titleMax}.` });
  } else {
    score += WEIGHTS.titleLength;
  }
  if (focusKeyword && title.toLowerCase().includes(focusKeyword.toLowerCase())) {
    score += WEIGHTS.titleHasFocusKw;
  } else if (focusKeyword) {
    issues.push({ type: 'title_no_keyword', severity: 'improvement', message: `Add focus keyword "${focusKeyword}" to the title.` });
  }
  return { score, issues };
}

function checkDescription(desc, focusKeyword) {
  const issues = [];
  const len = desc?.length ?? 0;
  let score = 0;
  if (!desc) {
    issues.push({ type: 'desc_missing', severity: 'error', message: 'No meta description found.' });
    return { score, issues };
  }
  score += WEIGHTS.descPresent;
  if (len < seoConfig.meta.descriptionMin) {
    issues.push({ type: 'desc_too_short', severity: 'warning', message: `Meta description is ${len} chars; aim for ${seoConfig.meta.descriptionMin}–${seoConfig.meta.descriptionMax}.` });
  } else if (len > seoConfig.meta.descriptionMax) {
    issues.push({ type: 'desc_too_long', severity: 'warning', message: `Meta description is ${len} chars; trim to under ${seoConfig.meta.descriptionMax}.` });
  } else {
    score += WEIGHTS.descLength;
  }
  if (focusKeyword && desc.toLowerCase().includes(focusKeyword.toLowerCase())) {
    score += WEIGHTS.descHasFocusKw;
  } else if (focusKeyword) {
    issues.push({ type: 'desc_no_keyword', severity: 'improvement', message: `Add focus keyword "${focusKeyword}" to the meta description.` });
  }
  return { score, issues };
}

function checkContent(wordCount, focusKeyword, kwAnalysis) {
  const issues = [];
  let score = 0;
  if (wordCount < seoConfig.meta.contentMinLength) {
    issues.push({ type: 'content_too_short', severity: 'error', message: `Content is ${wordCount} words; add more content (minimum ${seoConfig.meta.contentMinLength} words, ideally ${seoConfig.meta.contentGoodLength}+).` });
  } else {
    score += WEIGHTS.contentLength;
    if (wordCount < seoConfig.meta.contentGoodLength) {
      issues.push({ type: 'content_short', severity: 'improvement', message: `Content is ${wordCount} words; more content (${seoConfig.meta.contentGoodLength}+) improves ranking.` });
    }
  }
  const focusKwResult = kwAnalysis.keywords.find(k => k.type === 'focus');
  if (focusKwResult) {
    if (focusKwResult.densityStatus === 'good') {
      score += WEIGHTS.keywordDensity;
    } else if (focusKwResult.densityStatus === 'too_high') {
      issues.push({ type: 'keyword_stuffing', severity: 'error', message: `Focus keyword density is ${focusKwResult.density}%; this looks like keyword stuffing. Reduce to under 2.5%.` });
    } else {
      issues.push({ type: 'keyword_low_density', severity: 'improvement', message: `Focus keyword density is ${focusKwResult.density}%; consider using it more frequently.` });
    }
    if (focusKwResult.inHeadings) {
      score += WEIGHTS.keywordInH1;
    } else {
      issues.push({ type: 'keyword_not_in_heading', severity: 'improvement', message: `Add focus keyword "${focusKeyword}" to an H1 or H2 heading.` });
    }
    if (focusKwResult.inFirstSentence) {
      score += WEIGHTS.keywordInFirstPara;
    } else {
      issues.push({ type: 'keyword_not_in_intro', severity: 'improvement', message: `Use focus keyword "${focusKeyword}" in the first paragraph.` });
    }
  }
  const secCount = kwAnalysis.keywords.filter(k => k.type === 'secondary' && k.count > 0).length;
  if (secCount > 0) score += WEIGHTS.secondaryKeywords;
  return { score, issues };
}

function checkHeadings(headings) {
  const issues = [];
  let score = 0;
  if (headings.h1 === 0) {
    issues.push({ type: 'no_h1', severity: 'error', message: 'No H1 heading found. Add an H1.' });
  } else if (headings.h1 > 1) {
    issues.push({ type: 'multiple_h1', severity: 'warning', message: `Multiple H1 headings found (${headings.h1}). Use only one H1.` });
  } else {
    score += WEIGHTS.headingStructure;
  }
  if (headings.h2 === 0) {
    issues.push({ type: 'no_h2', severity: 'improvement', message: 'No H2 headings found. Use H2s to structure your content.' });
  }
  return { score, issues };
}

function checkLinks(links) {
  const issues = [];
  let score = 0;
  if (links.internal > 0) {
    score += WEIGHTS.internalLinks;
  } else {
    issues.push({ type: 'no_internal_links', severity: 'improvement', message: 'No internal links found. Add internal links to improve site structure.' });
  }
  if (links.external === 0) {
    issues.push({ type: 'no_external_links', severity: 'improvement', message: 'No outbound links found. Consider linking to authoritative external sources.' });
  }
  return { score, issues };
}

function checkImages(images) {
  const issues = [];
  let score = WEIGHTS.imagesHaveAlt;
  if (images.withoutAlt > 0) {
    const penalty = Math.round((images.withoutAlt / Math.max(1, images.total)) * WEIGHTS.imagesHaveAlt);
    score = Math.max(0, score - penalty);
    issues.push({ type: 'images_missing_alt', severity: 'error', message: `${images.withoutAlt} of ${images.total} image(s) lack alt text. Add descriptive alt attributes.` });
  }
  return { score, issues };
}

module.exports = { WEIGHTS, checkTitle, checkDescription, checkContent, checkHeadings, checkLinks, checkImages };

// MukonoTalks

