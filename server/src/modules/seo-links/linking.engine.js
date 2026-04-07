/**
 * Internal Linking Engine
 * Scans content, suggests internal links, detects orphaned pages.
 * @module modules/internal-links/linking.engine
 */

'use strict';

const LinkRule = require('./link-rules.model');

// ─── Helpers ──────────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find all matching link rules for a piece of content.
 * Ranked by priority descending.
 */
async function suggestLinks(content = '', pageSlug = '') {
  const rules = await LinkRule.find({ isActive: true })
    .sort('-priority')
    .lean();

  const suggestions = [];
  const foundKeywords = new Set();

  for (const rule of rules) {
    // Skip if this rule's target is the current page (avoid self-links)
    if (pageSlug && rule.targetURL === pageSlug) continue;

    const kw     = rule.keyword.trim();
    const anchor = rule.anchorText || kw;

    if (foundKeywords.has(kw)) continue; // one rule per keyword

    const regex = new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i');
    if (regex.test(content)) {
      foundKeywords.add(kw);
      suggestions.push({
        keyword:    kw,
        anchorText: anchor,
        targetURL:  rule.targetURL,
        priority:   rule.priority,
        autoInsert: rule.autoInsert,
        ruleId:     rule._id,
      });
    }
  }

  return suggestions;
}

/**
 * Insert internal links into HTML content string.
 * Replaces first occurrence of each keyword with an anchor tag.
 * Only processes rules with autoInsert = true.
 */
async function insertLinks(html = '', pageSlug = '') {
  const rules = await LinkRule.find({ isActive: true, autoInsert: true })
    .sort('-priority')
    .lean();

  let modified = html;
  const inserted = [];

  for (const rule of rules) {
    if (pageSlug && rule.targetURL === pageSlug) continue;

    const kw     = rule.keyword.trim();
    const anchor = rule.anchorText || kw;
    const regex  = new RegExp(`(?<![<"'])\\b(${escapeRegex(kw)})\\b(?![^<]*>)`, 'i');

    if (regex.test(modified)) {
      // Replace only the FIRST occurrence to avoid over-linking
      modified = modified.replace(regex, `<a href="${rule.targetURL}" title="${anchor}">${anchor}</a>`);
      inserted.push({ keyword: kw, targetURL: rule.targetURL });

      // Update usage count (fire-and-forget)
      LinkRule.findByIdAndUpdate(rule._id, { $inc: { usageCount: 1 } }).catch(() => {});
    }
  }

  return { html: modified, inserted };
}

/**
 * Count all internal links pointing to each URL slug.
 * Used to detect orphaned pages (pages with 0 inbound internal links).
 */
async function getLinkCounts() {
  const rules = await LinkRule.find({ isActive: true }, 'targetURL usageCount').lean();
  const map = {};
  for (const r of rules) {
    map[r.targetURL] = (map[r.targetURL] || 0) + r.usageCount;
  }
  return map;
}

/**
 * Detect orphaned pages — pages with no inbound internal links.
 * @param {string[]} allPageSlugs - list of all known page slugs
 */
async function detectOrphanedPages(allPageSlugs = []) {
  const linkCounts = await getLinkCounts();
  return allPageSlugs.filter(slug => !linkCounts[slug] || linkCounts[slug] === 0);
}

// ─── CRUD for Link Rules ───────────────────────────────────────

const LinkRulesService = {
  async getAll({ page = 1, limit = 20, search } = {}) {
    const filter = { isActive: true };
    if (search) filter.keyword = { $regex: search, $options: 'i' };
    const skip  = (page - 1) * limit;
    const total = await LinkRule.countDocuments(filter);
    const items = await LinkRule.find(filter)
      .sort('-priority -createdAt')
      .skip(skip)
      .limit(limit)
      .lean();
    return { items, total, page, pages: Math.ceil(total / limit) };
  },

  async create(data, userId) {
    return LinkRule.create({
      ...data,
      keyword:   data.keyword.toLowerCase().trim(),
      createdBy: userId,
    });
  },

  async update(id, data) {
    if (data.keyword) data.keyword = data.keyword.toLowerCase().trim();
    return LinkRule.findByIdAndUpdate(id, data, { new: true });
  },

  async delete(id) {
    return LinkRule.findByIdAndDelete(id);
  },

  suggestLinks,
  insertLinks,
  getLinkCounts,
  detectOrphanedPages,
};

module.exports = LinkRulesService;

// MukonoTalks

