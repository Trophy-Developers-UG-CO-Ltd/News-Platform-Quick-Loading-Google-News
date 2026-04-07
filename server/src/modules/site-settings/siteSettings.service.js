/**
 * Site Settings service
 * Business logic for site-wide configuration
 * @module modules/site-settings/siteSettings.service
 */

const SiteSettings = require('./siteSettings.model');

/**
 * Get the singleton site settings document (creates with defaults if absent)
 */
const getSettings = async () => {
  let doc = await SiteSettings.findById('default');
  if (!doc) {
    doc = await SiteSettings.create({ _id: 'default' });
  }
  return doc;
};

/**
 * Update site settings (admin only)
 * @param {object} updates - Partial settings fields
 * @param {string} updatedById - The admin user's ID
 */
const updateSettings = async (updates, updatedById) => {
  const allowed = ['ga4MeasurementId'];

  const sanitized = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  }
  sanitized.updatedBy = updatedById;

  const doc = await SiteSettings.findByIdAndUpdate('default', sanitized, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });

  return doc;
};

module.exports = { getSettings, updateSettings };

// MukonoTalks

