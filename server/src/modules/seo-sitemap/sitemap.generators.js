/**
 * Sitemap Generators
 * Async functions that query the database and build XML sitemap sections.
 * Each generator returns a complete XML string ready to serve.
 * @module modules/seo-sitemap/sitemap.generators
 */

'use strict';

const seoConfig = require('../../config/seo.config');
const { urlEntry, wrapSitemap, wrapSitemapIndex, sitemapIndexEntry, SITE_URL } = require('./sitemap.helpers');

// ─── Sitemap index ─────────────────────────────────────────────

async function generateSitemapIndex() {
  const now = new Date().toISOString();
  const entries = [
    sitemapIndexEntry(`${SITE_URL}/sitemap-pages.xml`,      now),
    sitemapIndexEntry(`${SITE_URL}/sitemap-articles.xml`,   now),
    sitemapIndexEntry(`${SITE_URL}/sitemap-categories.xml`, now),
    sitemapIndexEntry(`${SITE_URL}/news-sitemap.xml`,       now),
    sitemapIndexEntry(`${SITE_URL}/video-sitemap.xml`,      now),
  ];
  return wrapSitemapIndex(entries);
}

// ─── Pages ─────────────────────────────────────────────────────

async function generatePagesSitemap() {
  let Page;
  try { Page = require('../pages/page.model'); } catch { /* ok */ }

  const staticPages = [
    { loc: '/',         priority: 1.0, changefreq: 'daily' },
    { loc: '/news', priority: 0.9, changefreq: 'hourly' },
    { loc: '/local', priority: 0.8, changefreq: 'daily' },
    { loc: '/entertainment', priority: 0.8, changefreq: 'daily' },
    { loc: '/videos', priority: 0.7, changefreq: 'daily' },
  ];

  const entries = staticPages.map(p => urlEntry({
    loc: `${SITE_URL}${p.loc}`, changefreq: p.changefreq,
    priority: p.priority, lastmod: new Date().toISOString(),
  }));

  if (Page) {
    const pages = await Page.find({ status: 'published' }, 'slug updatedAt').lean();
    for (const p of pages) {
      const slug = typeof p.slug === 'object' ? p.slug.en : p.slug;
      if (!slug) continue;
      entries.push(urlEntry({ loc: `${SITE_URL}/${slug}`, lastmod: p.updatedAt, changefreq: 'monthly', priority: 0.6 }));
    }
  }
  return wrapSitemap(entries);
}

// ─── Articles ──────────────────────────────────────────────────

async function generateArticlesSitemap() {
  let Article;
  try { Article = require('../articles/article.model'); } catch { return wrapSitemap([]); }

  const articles = await Article.find({ publishStatus: 'published' }, 'localizedSlug title featuredImage updatedAt publishedAt category').lean();
  const entries = articles.map(a => {
    const slug   = a.localizedSlug?.en;
    if (!slug) return null;
    const category = String(a.category || 'general').trim().toLowerCase();
    const imageUrl = a.featuredImage;
    const images = imageUrl ? [{ url: imageUrl.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl}`, title: a.title?.en || '' }] : [];
    return urlEntry({
      loc: `${SITE_URL}/${category}/${slug}`, lastmod: a.updatedAt, changefreq: 'hourly', priority: 0.9, images,
      hreflang: {
        en: `${SITE_URL}/${category}/${a.localizedSlug?.en || slug}`,
        ...(a.localizedSlug?.zh && { zh: `${SITE_URL}/${category}/${a.localizedSlug.zh}` }),
        ...(a.localizedSlug?.sw && { sw: `${SITE_URL}/${category}/${a.localizedSlug.sw}` }),
      },
    });
  }).filter(Boolean);
  return wrapSitemap(entries, { hasImage: entries.some(e => e.includes('<image:')) });
}

// ─── Categories ────────────────────────────────────────────────

async function generateCategoriesSitemap() {
  let Category;
  try { Category = require('../categories/category.model'); } catch { return wrapSitemap([]); }

  const categories = await Category.find({}, 'slug updatedAt').lean();
  const entries = categories.map(c => urlEntry({ loc: `${SITE_URL}/categories/${c.slug}`, lastmod: c.updatedAt, changefreq: 'weekly', priority: 0.7 }));
  return wrapSitemap(entries);
}

// ─── News ──────────────────────────────────────────────────────

async function generateNewsSitemap() {
  let Article;
  try { Article = require('../articles/article.model'); } catch { return wrapSitemap([], { hasNews: true }); }

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const articles = await Article.find(
    { publishStatus: 'published', publishedAt: { $gte: twoDaysAgo } },
    'localizedSlug title publishedAt tags category'
  ).lean();

  const entries = articles
    .filter((a) => a.localizedSlug?.en)
    .map(a => urlEntry({
      loc:     `${SITE_URL}/${String(a.category || 'general').trim().toLowerCase()}/${a.localizedSlug.en}`,
      lastmod: a.publishedAt,
      news: {
        publication: seoConfig.siteName, language: 'en',
        publicationDate: a.publishedAt,  title: a.title?.en || '',
        keywords: (a.tags || []).join(', '),
      },
    }));
  return wrapSitemap(entries, { hasNews: true });
}

// ─── Video ─────────────────────────────────────────────────────

async function generateVideoSitemap() {
  return wrapSitemap([], { hasVideo: true });
}

module.exports = {
  generateSitemapIndex,
  generatePagesSitemap,
  generateArticlesSitemap,
  generateCategoriesSitemap,
  generateNewsSitemap,
  generateVideoSitemap,
};

// MukonoTalks

