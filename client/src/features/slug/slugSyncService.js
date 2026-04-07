/**
 * slugSyncService
 * Cross-system slug synchronisation:
 *   1. Create a 301 redirect (old path → new path)
 *   2. Update navigation menu items that reference the old URL
 * @module features/slug/slugSyncService
 */

import api from '../../app/axios';

const slugSyncService = {
  /**
   * Create a 301 redirect for a slug change.
   * The /api/redirects endpoint auto-approves 'slug-change' source.
   *
   * @param {string} fromPath - e.g. "/en/page/old-slug"
   * @param {string} toPath   - e.g. "/en/page/new-slug"
   * @param {string} resourceType - "page" | "article" | "product"
   */
  async createSlugRedirect(fromPath, toPath, resourceType = 'page') {
    const { data } = await api.post('/redirects', {
      fromPath,
      toPath,
      statusCode: 301,
      source: 'slug-change',
      resourceType,
      note: `Auto-created on slug change: ${fromPath} → ${toPath}`,
    });
    return data;
  },

  /**
   * Fetch admin nav items, replace any with href === oldHref to use newHref,
   * then save the updated list back to the API.
   *
   * @param {string} oldHref - the old relative URL
   * @param {string} newHref - the new relative URL
   * @returns {number} count of items that were updated
   */
  async updateNavItemsForSlug(oldHref, newHref) {
    // Fetch current nav items
    const { data: navData } = await api.get('/navigation/admin');
    const items = navData?.data ?? [];

    // Normalise both sides: lowercase + strip trailing slash
    const normalise = (h) => (h || '').toLowerCase().replace(/\/+$/, '');
    const normOld = normalise(oldHref);

    let updatedCount = 0;
    const updatedItems = items.map((item) => {
      if (normalise(item.href) === normOld) {
        updatedCount += 1;
        return { ...item, href: newHref };
      }
      return item;
    });

    if (updatedCount > 0) {
      await api.put('/navigation', { items: updatedItems });
    }

    return updatedCount;
  },
};

export default slugSyncService;

// MukonoTalks

