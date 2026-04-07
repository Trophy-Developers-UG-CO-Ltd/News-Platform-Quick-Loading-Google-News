/**
 * Technical SEO service
 * Manages robots.txt editing, canonical automation, duplicate detection,
 * crawl budget hints, and technical SEO checks.
 * @module modules/technical-seo/technical.service
 */

'use strict';

const fs   = require('fs').promises;
const path = require('path');
const seoConfig = require('../../config/seo.config');

const ROBOTS_PATH  = path.resolve(process.cwd(), '..', 'client', 'public', 'robots.txt');
const SITE_URL     = seoConfig.siteUrl;

// ─── robots.txt ────────────────────────────────────────────────

const TechnicalSeoService = {

  /**
   * Read current robots.txt content.
   */
  async getRobots() {
    try {
      const content = await fs.readFile(ROBOTS_PATH, 'utf-8');
      return content;
    } catch {
      return this.generateDefaultRobots();
    }
  },

  /**
   * Write new robots.txt content.
   * Validates dangerous wildcard disallow patterns.
   */
  async saveRobots(content) {
    if (typeof content !== 'string') throw new Error('robots.txt content must be a string');
    // Security check: disallow saving "Disallow: /" without a specific bot
    const lines = content.split('\n');
    let userAgentAll = false;
    for (const line of lines) {
      const l = line.trim().toLowerCase();
      if (l.startsWith('user-agent: *')) userAgentAll = true;
      if (userAgentAll && l.startsWith('disallow: /') && l === 'disallow: /') {
        throw new Error('Refusing to block all crawlers with "Disallow: /". Be more specific.');
      }
    }
    await fs.writeFile(ROBOTS_PATH, content, 'utf-8');
    return content;
  },

  /**
   * Generate a sensible default robots.txt.
   */
  generateDefaultRobots() {
    return [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      'Disallow: /admin/',
      'Disallow: /uploads/private/',
      '',
      `Sitemap: ${SITE_URL}/sitemap.xml`,
    ].join('\n');
  },

  /**
   * Canonical URL checks — find pages with non-canonical URLs.
   * Looks for duplicate slugs with trailing slashes, uppercase, etc.
   */
  async runCanonicalAudit() {
    const SeoMetadata = require('../seo-core/metadata.model');
    const pages = await SeoMetadata.find({ isActive: true }, 'pageSlug canonical').lean();

    const issues = [];
    for (const p of pages) {
      const slug = p.pageSlug;
      // Check for trailing slash
      if (slug !== '/' && slug.endsWith('/')) {
        issues.push({ slug, issue: 'trailing_slash', message: `Remove trailing slash from "${slug}".` });
      }
      // Check for uppercase letters
      if (slug !== slug.toLowerCase()) {
        issues.push({ slug, issue: 'uppercase_slug', message: `Slug "${slug}" has uppercase letters.` });
      }
      // Check missing canonical
      if (!p.canonical) {
        issues.push({ slug, issue: 'missing_canonical', message: `Page "${slug}" has no canonical URL set.` });
      }
    }

    return issues;
  },

  /**
   * Duplicate content detection — find pages with identical meta descriptions.
   */
  async detectDuplicateMeta() {
    const SeoMetadata = require('../seo-core/metadata.model');
    const pages = await SeoMetadata.find({ isActive: true, metaDescription: { $exists: true, $ne: '' } }, 'pageSlug metaDescription title').lean();

    const descMap  = {};
    const titleMap = {};
    for (const p of pages) {
      if (p.metaDescription) {
        if (!descMap[p.metaDescription]) descMap[p.metaDescription] = [];
        descMap[p.metaDescription].push(p.pageSlug);
      }
      if (p.title) {
        if (!titleMap[p.title]) titleMap[p.title] = [];
        titleMap[p.title].push(p.pageSlug);
      }
    }

    const duplicateDesc  = Object.entries(descMap).filter(([, slugs]) => slugs.length > 1).map(([desc, slugs]) => ({ desc, slugs }));
    const duplicateTitles = Object.entries(titleMap).filter(([, slugs]) => slugs.length > 1).map(([title, slugs]) => ({ title, slugs }));

    return { duplicateDescriptions: duplicateDesc, duplicateTitles };
  },

  /**
   * Orphan page detection — pages with no internal links pointing to them.
   */
  async detectOrphanPages() {
    const SeoMetadata    = require('../seo-core/metadata.model');
    const LinkingEngine  = require('../seo-links/linking.engine');

    const pages       = await SeoMetadata.find({ isActive: true }, 'pageSlug').lean();
    const allSlugs    = pages.map(p => p.pageSlug);
    const linkCounts  = await LinkingEngine.getLinkCounts();

    const orphans = allSlugs.filter(slug => slug !== '/' && (!linkCounts[slug] || linkCounts[slug] === 0));
    return orphans;
  },

  /**
   * Full technical SEO audit report.
   */
  async runFullAudit() {
    const [canonical, duplicates, orphans] = await Promise.all([
      this.runCanonicalAudit(),
      this.detectDuplicateMeta(),
      this.detectOrphanPages(),
    ]);

    const totalIssues = canonical.length + duplicates.duplicateDescriptions.length + duplicates.duplicateTitles.length + orphans.length;

    return {
      totalIssues,
      canonical,
      duplicates,
      orphans,
      auditedAt: new Date().toISOString(),
    };
  },

  /**
   * URL cleanup report — finds slugs with common issues.
   */
  async urlCleanupReport() {
    const SeoMetadata = require('../seo-core/metadata.model');
    const pages = await SeoMetadata.find({ isActive: true }, 'pageSlug').lean();
    const issues = [];

    for (const { pageSlug } of pages) {
      if (/[A-Z]/.test(pageSlug))              issues.push({ slug: pageSlug, issue: 'uppercase' });
      if (pageSlug.includes('_'))              issues.push({ slug: pageSlug, issue: 'underscores' });
      if (pageSlug !== pageSlug.trim())        issues.push({ slug: pageSlug, issue: 'whitespace' });
      if (/ /.test(pageSlug))                  issues.push({ slug: pageSlug, issue: 'spaces' });
      if (pageSlug.length > 100)               issues.push({ slug: pageSlug, issue: 'too_long' });
    }

    return issues;
  },
};

module.exports = TechnicalSeoService;

// MukonoTalks

