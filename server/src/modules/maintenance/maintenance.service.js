/**
 * Maintenance service
 * Business logic for maintenance mode
 * @module modules/maintenance/maintenance.service
 */

const Maintenance = require('./maintenance.model');

/**
 * Get the singleton maintenance document (creates with defaults if absent)
 */
const getStatus = async () => {
  let doc = await Maintenance.findById('default');
  if (!doc) {
    doc = await Maintenance.create({ _id: 'default' });
  }
  return doc;
};

/**
 * Toggle or update maintenance mode (developer only)
 * @param {object} updates - { isEnabled, message?, estimatedEnd? }
 * @param {string} updatedById - The developer user's ID
 */
const updateStatus = async (updates, updatedById) => {
  const allowed = ['isEnabled', 'message', 'estimatedEnd'];

  const sanitized = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  }
  sanitized.updatedBy = updatedById;

  const doc = await Maintenance.findByIdAndUpdate('default', sanitized, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });

  return doc;
};

module.exports = { getStatus, updateStatus };

// MukonoTalks

