/**
 * Format helpers
 * Shared formatting utilities
 * @module shared/formatters
 */

/**
 * Format price in USD
 * @param {number} amount
 * @returns {string}
 */
export const formatPrice = (amount) => {
  if (amount == null) return 'N/A';
  return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format date for SA locale
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format short date
 * @param {string|Date} date
 * @returns {string}
 */
export const formatShortDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-ZA');
};

/**
 * Truncate text to maxLength with ellipsis
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export const truncate = (text, maxLength = 100) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// MukonoTalks

