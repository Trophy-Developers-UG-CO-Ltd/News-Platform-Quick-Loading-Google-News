/**
 * SEO Analyzer Service
 * Orchestrates scoring: delegates checks to analyzer.checks.js,
 * keyword analysis to keyword.engine, readability to readability.engine.
 * Returns a full SEO report matching Yoast / RankMath output.
 * @module modules/seo-analyzer/analyzer.service
 */

'use strict';

const { analyzeKeywords }  = require('./keyword.engine');
const { analyzeReadability } = require('./readability.engine');
const { WEIGHTS, checkTitle, checkDescription, checkContent, checkHeadings, checkLinks, checkImages } = require('./analyzer.checks');
const seoConfig = require('../../config/seo.config');

/**
 * Run a full SEO analysis on a page.
 * @param {object} opts
 * @param {string}   opts.content
 * @param {string}   opts.title
 * @param {string}   opts.metaDescription
 * @param {string[]} opts.focusKeywords
 * @param {string[]} opts.secondaryKeywords
 * @param {string}   [opts.siteUrl]
 * @returns {object} Full SEO analysis report
 */
async function analyze({
  content = '', title = '', metaDescription = '',
  focusKeywords = [], secondaryKeywords = [], siteUrl = '',
}) {
  const focusKw = focusKeywords[0] || '';

  const kwAnalysis  = analyzeKeywords({ content, title, metaDescription, focusKeywords, secondaryKeywords, siteUrl });
  const readability = analyzeReadability(content);

  const titleCheck   = checkTitle(title, focusKw);
  const descCheck    = checkDescription(metaDescription, focusKw);
  const contentCheck = checkContent(kwAnalysis.wordCount, focusKw, kwAnalysis);
  const headingCheck = checkHeadings(kwAnalysis.headings);
  const linkCheck    = checkLinks(kwAnalysis.links);
  const imageCheck   = checkImages(kwAnalysis.images);

  const rawSeoScore = titleCheck.score + descCheck.score + contentCheck.score +
                      headingCheck.score + linkCheck.score + imageCheck.score;
  const readabilityContrib = Math.round((readability.readabilityScore / 100) * WEIGHTS.readability);
  const seoScore = Math.min(100, rawSeoScore + readabilityContrib);

  const issues = [
    ...titleCheck.issues, ...descCheck.issues, ...contentCheck.issues,
    ...headingCheck.issues, ...linkCheck.issues, ...imageCheck.issues,
    ...readability.issues,
  ];

  let grade = 'Poor';
  if (seoScore >= seoConfig.scoring.excellent)             grade = 'Excellent';
  else if (seoScore >= seoConfig.scoring.good)             grade = 'Good';
  else if (seoScore >= seoConfig.scoring.needsImprovement) grade = 'Needs Improvement';

  const recommendations = issues
    .filter(i => i.severity === 'error' || i.severity === 'warning')
    .slice(0, 10)
    .map(i => i.message);

  return {
    seoScore, readabilityScore: readability.readabilityScore, grade,
    readabilityGrade: readability.grade, issues, recommendations,
    keywords: kwAnalysis.keywords, wordCount: kwAnalysis.wordCount,
    headings: kwAnalysis.headings, links: kwAnalysis.links, images: kwAnalysis.images,
    readability: {
      fleschScore: readability.fleschScore, fleschLabel: readability.fleschLabel,
      avgSentenceLength: readability.avgSentenceLength,
      passiveVoicePercent: readability.passiveVoicePercent,
      transitionWordPercent: readability.transitionWordPercent,
      paragraphs: readability.paragraphs,
    },
  };
}

module.exports = { analyze };

// MukonoTalks

