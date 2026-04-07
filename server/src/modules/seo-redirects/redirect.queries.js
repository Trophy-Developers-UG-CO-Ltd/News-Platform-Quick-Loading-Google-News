/**
 * Redirect Queries
 * Read-only query methods for the Redirect resource:
 * list with filters/pagination, aggregate stats, resolve, and click tracking.
 * @module modules/seo-redirects/redirect.queries
 */

'use strict';

const Redirect = require('./redirect.model');
const logger   = require('../../utils/logger');

/**
 * Paginated list for the admin UI.
 */
const getAllRedirects = async (query = {}) => {
  const { status, source, resourceType, search, page = 1, limit = 50 } = query;
  const filter = {};
  if (status)       filter.status = status;
  if (source)       filter.source = source;
  if (resourceType) filter.resourceType = resourceType;
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ fromPath: re }, { toPath: re }];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [redirects, total] = await Promise.all([
    Redirect.find(filter)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Redirect.countDocuments(filter),
  ]);

  return { redirects, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
};

/**
 * Aggregate stats for the admin dashboard.
 */
const getStats = async () => {
  const [total, pending, approved, rejected, clickAgg] = await Promise.all([
    Redirect.countDocuments(),
    Redirect.countDocuments({ status: 'pending' }),
    Redirect.countDocuments({ status: 'approved' }),
    Redirect.countDocuments({ status: 'rejected' }),
    Redirect.aggregate([{ $group: { _id: null, totalClicks: { $sum: '$clickCount' } } }]),
  ]);
  return { total, pending, approved, rejected, totalClicks: clickAgg[0]?.totalClicks || 0 };
};

/**
 * Resolve an approved redirect for a given fromPath.
 */
const resolveRedirect = async (fromPath) => {
  if (!fromPath) return null;
  return Redirect.findOne({
    fromPath: fromPath.toLowerCase().trim(),
    status: 'approved',
  }).select('toPath statusCode');
};

/**
 * Increment click counter for a followed redirect.
 */
const trackClick = async (fromPath) => {
  if (!fromPath) return;
  await Redirect.findOneAndUpdate(
    { fromPath: fromPath.toLowerCase().trim(), status: 'approved' },
    { $inc: { clickCount: 1 }, $set: { lastClickedAt: new Date() } }
  ).catch((err) => logger.warn('[RedirectService] trackClick failed:', err.message));
};

module.exports = { getAllRedirects, getStats, resolveRedirect, trackClick };

// MukonoTalks

