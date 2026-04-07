/**
 * General utility/helper functions
 * @module utils/helpers
 */

const slugify = require('slugify');
const crypto = require('crypto');

/**
 * Generate URL-friendly slug from text
 * @param {string} text - Text to slugify
 * @returns {string} URL-safe slug
 */
const generateSlug = (text) => {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
};

/**
 * Generate a unique slug by appending random suffix if needed
 * @param {string} text - Base text
 * @returns {string} Unique slug
 */
const generateUniqueSlug = (text) => {
  const base = generateSlug(text);
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
};

/**
 * Calculate pagination parameters
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} skip, limit, page
 */
const paginate = (page = 1, limit = 10) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (parsedPage - 1) * parsedLimit;

  return { skip, limit: parsedLimit, page: parsedPage };
};

/**
 * Build pagination response metadata
 * @param {number} total - Total document count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const paginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Sanitize MongoDB sort string from query parameter
 * @param {string} sortStr - Comma-separated fields (prefix with - for desc)
 * @param {Array} allowedFields - List of allowed sort fields
 * @returns {Object} Mongoose sort object
 */
const buildSort = (sortStr, allowedFields = []) => {
  if (!sortStr) return { createdAt: -1 };

  const sort = {};
  sortStr.split(',').forEach((field) => {
    const direction = field.startsWith('-') ? -1 : 1;
    const fieldName = field.replace(/^-/, '');
    if (allowedFields.length === 0 || allowedFields.includes(fieldName)) {
      sort[fieldName] = direction;
    }
  });

  return Object.keys(sort).length ? sort : { createdAt: -1 };
};

module.exports = {
  generateSlug,
  generateUniqueSlug,
  paginate,
  paginationMeta,
  buildSort,
};

// MukonoTalks

