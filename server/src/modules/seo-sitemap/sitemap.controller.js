/**
 * Sitemap Generator
 * Generates XML sitemaps per language with hreflang annotations
 * @module modules/sitemap/sitemap.controller
 */

const Category = require('../categories/category.model');
const Page = require('../pages/page.model');
const Article = require('../articles/article.model');
const { asyncHandler } = require('../../middlewares/error.middleware');
const { env } = require('../../config/env');

const SUPPORTED_LANGUAGES = ['en', 'zh', 'sw'];
const BASE_URL = env.CLIENT_URL || 'https://mukonotalks.ug';

/**
 * Generate XML sitemap index (links to per-language sitemaps)
 */
const getSitemapIndex = asyncHandler(async (req, res) => {
  try {
    const lastMod = new Date().toISOString();
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const lang of SUPPORTED_LANGUAGES) {
      xml += `  <sitemap>\n`;
      xml += `    <loc>${BASE_URL}/api/sitemap/${lang}.xml</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `  </sitemap>\n`;
    }

    xml += '</sitemapindex>';
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Generate language-specific sitemap with hreflang alternates
 */
const getLanguageSitemap = asyncHandler(async (req, res) => {
  try {
    const { lang } = req.params;
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      return res.status(404).json({ success: false, message: 'Language not supported' });
    }

    const [categories, pages, articles] = await Promise.all([
      Category.find({ isActive: true }).select('slug updatedAt').lean(),
      Page.find({ publishStatus: 'published' }).select('localizedSlug seo updatedAt').lean(),
      Article.find({ publishStatus: 'published' }).select('localizedSlug category updatedAt').lean(),
    ]);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

    // Helper: generate URL entry with hreflang alternates
    const addUrl = (path, lastMod, priority = '0.5', changefreq = 'weekly') => {
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}/${lang}${path}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>${changefreq}</changefreq>\n`;
      xml += `    <priority>${priority}</priority>\n`;

      // Hreflang alternates
      for (const altLang of SUPPORTED_LANGUAGES) {
        xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${BASE_URL}/${altLang}${path}" />\n`;
      }
      xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/en${path}" />\n`;

      xml += '  </url>\n';
    };

    // Static pages
    const now = new Date().toISOString();
    addUrl('/', now, '1.0', 'daily');
    addUrl('/news', now, '0.9', 'hourly');
    addUrl('/blog', now, '0.7', 'daily');
    addUrl('/login', now, '0.3', 'monthly');
    addUrl('/register', now, '0.3', 'monthly');
    addUrl('/privacy', now, '0.2', 'yearly');
    addUrl('/terms', now, '0.2', 'yearly');

    // CMS Pages
    for (const page of pages) {
      const canonical = page.seo?.en?.canonicalUrl;
      if (canonical) {
        // Use the custom canonical URL directly (no language prefix, no addUrl helper)
        const lastMod = page.updatedAt.toISOString();
        xml += '  <url>\n';
        xml += `    <loc>${canonical}</loc>\n`;
        xml += `    <lastmod>${lastMod}</lastmod>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        xml += '  </url>\n';
      } else {
        const slug = page.localizedSlug?.[lang] || page.localizedSlug?.en;
        if (slug) {
          addUrl(`/page/${slug}`, page.updatedAt.toISOString(), '0.6', 'monthly');
        }
      }
    }

    // Articles
    for (const article of articles) {
      const slug = article.localizedSlug?.[lang] || article.localizedSlug?.en;
      if (slug) {
        addUrl(`/${String(article.category || 'general').trim().toLowerCase()}/${slug}`, article.updatedAt.toISOString(), '0.8', 'daily');
      }
    }

    xml += '</urlset>';
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = { getSitemapIndex, getLanguageSitemap };

// MukonoTalks

