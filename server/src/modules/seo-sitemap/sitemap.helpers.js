/**
 * Sitemap XML Helpers
 * Low-level XML building utilities: escape, date formatting, URL entry builder,
 * and sitemap/sitemapindex wrappers.
 * @module modules/seo-sitemap/sitemap.helpers
 */

'use strict';

const seoConfig = require('../../config/seo.config');

const SITE_URL = seoConfig.siteUrl;

// ─── Primitives ────────────────────────────────────────────────

function escapeXml(str = '') {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

function isoDate(d) {
  try { return new Date(d).toISOString(); } catch { return new Date().toISOString(); }
}

// ─── URL entry builder ─────────────────────────────────────────

function urlEntry({ loc, lastmod, changefreq, priority, images = [], news = null, video = null, hreflang = {} }) {
  const lines = ['  <url>'];
  lines.push(`    <loc>${escapeXml(loc)}</loc>`);
  if (lastmod)    lines.push(`    <lastmod>${isoDate(lastmod)}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority !== undefined) lines.push(`    <priority>${priority}</priority>`);

  for (const img of images) {
    lines.push('    <image:image>');
    lines.push(`      <image:loc>${escapeXml(img.url)}</image:loc>`);
    if (img.title)   lines.push(`      <image:title>${escapeXml(img.title)}</image:title>`);
    if (img.caption) lines.push(`      <image:caption>${escapeXml(img.caption)}</image:caption>`);
    lines.push('    </image:image>');
  }

  if (news) {
    lines.push('    <news:news>');
    lines.push('      <news:publication>');
    lines.push(`        <news:name>${escapeXml(news.publication || SITE_URL)}</news:name>`);
    lines.push(`        <news:language>${news.language || 'en'}</news:language>`);
    lines.push('      </news:publication>');
    lines.push(`      <news:publication_date>${isoDate(news.publicationDate)}</news:publication_date>`);
    lines.push(`      <news:title>${escapeXml(news.title)}</news:title>`);
    if (news.keywords) lines.push(`      <news:keywords>${escapeXml(news.keywords)}</news:keywords>`);
    lines.push('    </news:news>');
  }

  if (video) {
    lines.push('    <video:video>');
    lines.push(`      <video:thumbnail_loc>${escapeXml(video.thumbnailUrl)}</video:thumbnail_loc>`);
    lines.push(`      <video:title>${escapeXml(video.title)}</video:title>`);
    lines.push(`      <video:description>${escapeXml(video.description)}</video:description>`);
    if (video.contentUrl)  lines.push(`      <video:content_url>${escapeXml(video.contentUrl)}</video:content_url>`);
    if (video.duration)    lines.push(`      <video:duration>${video.duration}</video:duration>`);
    if (video.publishDate) lines.push(`      <video:publication_date>${isoDate(video.publishDate)}</video:publication_date>`);
    lines.push('    </video:video>');
  }

  for (const [lang, href] of Object.entries(hreflang)) {
    lines.push(`    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(href)}"/>`);
  }

  lines.push('  </url>');
  return lines.join('\n');
}

// ─── Wrappers ──────────────────────────────────────────────────

function wrapSitemap(entries, { hasNews = false, hasVideo = false, hasImage = false } = {}) {
  const ns = [
    'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    'xmlns:xhtml="http://www.w3.org/1999/xhtml"',
  ];
  if (hasImage) ns.push('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
  if (hasNews)  ns.push('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"');
  if (hasVideo) ns.push('xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"');
  return ['<?xml version="1.0" encoding="UTF-8"?>', `<urlset ${ns.join(' ')}>`, ...entries, '</urlset>'].join('\n');
}

function wrapSitemapIndex(entries) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</sitemapindex>',
  ].join('\n');
}

function sitemapIndexEntry(loc, lastmod) {
  return `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${isoDate(lastmod)}</lastmod>\n  </sitemap>`;
}

module.exports = { escapeXml, isoDate, urlEntry, wrapSitemap, wrapSitemapIndex, sitemapIndexEntry, SITE_URL };

// MukonoTalks

