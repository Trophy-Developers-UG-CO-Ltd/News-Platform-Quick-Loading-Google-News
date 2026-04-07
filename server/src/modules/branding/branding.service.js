/**
 * Branding service
 * Business logic for white-label branding settings
 * @module modules/branding/branding.service
 */

const Branding = require('./branding.model');

/**
 * Get the singleton branding document (creates with defaults if absent)
 */
const getBranding = async () => {
  let doc = await Branding.findById('default');
  if (!doc) {
    doc = await Branding.create({ _id: 'default' });
  }
  return doc;
};

/**
 * Update branding settings (developer only)
 * @param {object} updates - Partial branding fields
 * @param {string} updatedById - The developer user's ID
 */
const updateBranding = async (updates, updatedById) => {
  const allowed = [
    'platformName',
    'platformTagline',
    'primaryColor',
    'logoUrl',
    'faviconUrl',
    'supportEmail',
  ];

  const sanitized = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  }
  sanitized.updatedBy = updatedById;

  const doc = await Branding.findByIdAndUpdate('default', sanitized, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });

  return doc;
};

module.exports = { getBranding, updateBranding };

// MukonoTalks

