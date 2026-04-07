/**
 * Redirect Service — mutation operations
 * Handles redirect CRUD, approval/rejection workflow.
 * Read-only queries (getAll, getStats, resolve, trackClick) live in redirect.queries.js.
 * @module modules/seo-redirects/redirect.service
 */

'use strict';

const Redirect = require('./redirect.model');
const AuditService = require('../audit/audit.service');
const logger = require('../../utils/logger');
const { getAllRedirects, getStats, resolveRedirect, trackClick } = require('./redirect.queries');
const { invalidateCache } = require('./redirect.middleware');

// System-generated redirects (slug changes) are auto-approved so they go live immediately.
const AUTO_APPROVE_SOURCES = ['system', 'slug-change', 'auto'];

const createRedirect = async ({ fromPath, toPath, statusCode = 301, source = 'manual', resourceType = 'custom', resourceId = null, createdBy = null, note = '' }) => {
  if (!fromPath || !toPath) throw new Error('fromPath and toPath are required');
  const from = fromPath.toLowerCase().trim();
  if (from === toPath.trim()) return null;
  const autoApprove = AUTO_APPROVE_SOURCES.includes(source);
  const status = autoApprove ? 'approved' : 'pending';
  const approvedAt = autoApprove ? new Date() : null;
  try {
    const doc = await Redirect.findOneAndUpdate(
      { fromPath: from },
      { $set: { toPath: toPath.trim(), statusCode, source, resourceType, resourceId: resourceId || null, status, approvedBy: null, approvedAt, rejectedBy: null, rejectedAt: null, note }, $setOnInsert: { createdBy, clickCount: 0, lastClickedAt: null } },
      { upsert: true, new: true }
    );
    if (autoApprove) invalidateCache();
    return doc;
  } catch (err) {
    if (err.code === 11000) { logger.warn(`[RedirectService] Concurrent upsert race for ${from} — ignored`); return null; }
    throw err;
  }
};

const approveRedirect = async (id, req) => {
  const redirect = await Redirect.findById(id);
  if (!redirect) { const e = new Error('Redirect not found'); e.statusCode = 404; throw e; }
  const prevStatus = redirect.status;
  redirect.status = 'approved';
  redirect.approvedBy = req.user._id;
  redirect.approvedAt = new Date();
  redirect.rejectedBy = null; redirect.rejectedAt = null;
  await redirect.save();
  invalidateCache();
  AuditService.log({ action: 'REDIRECT_APPROVED', req, targetModel: 'Redirect', targetId: redirect._id, targetIdentifier: redirect.fromPath, changes: { status: { from: prevStatus, to: 'approved' } } });
  return redirect;
};

const rejectRedirect = async (id, req) => {
  const redirect = await Redirect.findById(id);
  if (!redirect) { const e = new Error('Redirect not found'); e.statusCode = 404; throw e; }
  const prevStatus = redirect.status;
  redirect.status = 'rejected';
  redirect.rejectedBy = req.user._id;
  redirect.rejectedAt = new Date();
  await redirect.save();
  invalidateCache();
  AuditService.log({ action: 'REDIRECT_REJECTED', req, targetModel: 'Redirect', targetId: redirect._id, targetIdentifier: redirect.fromPath, changes: { status: { from: prevStatus, to: 'rejected' } } });
  return redirect;
};

const updateRedirect = async (id, data, req) => {
  const redirect = await Redirect.findById(id);
  if (!redirect) { const e = new Error('Redirect not found'); e.statusCode = 404; throw e; }
  const changes = {};
  if (data.fromPath && data.fromPath.toLowerCase() !== redirect.fromPath) changes.fromPath = { from: redirect.fromPath, to: data.fromPath };
  if (data.toPath   && data.toPath !== redirect.toPath)     changes.toPath   = { from: redirect.toPath,   to: data.toPath };
  if (data.statusCode && data.statusCode !== redirect.statusCode) changes.statusCode = { from: redirect.statusCode, to: data.statusCode };
  if (data.fromPath)   redirect.fromPath   = data.fromPath.toLowerCase().trim();
  if (data.toPath)     redirect.toPath     = data.toPath.trim();
  if (data.statusCode) redirect.statusCode = data.statusCode;
  if (data.note !== undefined) redirect.note = data.note;
  if (redirect.status === 'rejected') {
    redirect.status = 'pending'; redirect.rejectedBy = null; redirect.rejectedAt = null;
    changes.status = { from: 'rejected', to: 'pending' };
  }
  await redirect.save();
  invalidateCache();
  AuditService.log({ action: 'REDIRECT_UPDATE', req, targetModel: 'Redirect', targetId: redirect._id, targetIdentifier: redirect.fromPath, changes });
  return redirect;
};

const deleteRedirect = async (id, req) => {
  const redirect = await Redirect.findById(id);
  if (!redirect) { const e = new Error('Redirect not found'); e.statusCode = 404; throw e; }
  await redirect.deleteOne();
  invalidateCache();
  AuditService.log({ action: 'REDIRECT_DELETE', req, targetModel: 'Redirect', targetId: redirect._id, targetIdentifier: redirect.fromPath });
};

module.exports = { createRedirect, getAllRedirects, getStats, approveRedirect, rejectRedirect, updateRedirect, deleteRedirect, resolveRedirect, trackClick };

// MukonoTalks

