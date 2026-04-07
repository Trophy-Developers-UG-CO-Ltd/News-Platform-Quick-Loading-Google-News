/**
 * ContentTemplate service
 * Business logic: CRUD, revision management, placeholder injection
 * @module modules/contentTemplates/contentTemplate.service
 */

const ContentTemplate = require('./contentTemplate.model');
const MAX_REVISIONS = 20;

// ─── Allowed HTML tags for validation ──────────────────────────
const ALLOWED_TAGS = new Set(['h1', 'h2', 'p', 'ul', 'li', 'strong']);

/**
 * Lightweight tag validator — rejects any tag NOT in the allow-list
 * and rejects all inline styles.
 * Returns { valid: Boolean, errors: String[] }
 */
function validateHtml(html) {
  const errors = [];

  // Reject inline styles
  if (/style\s*=/i.test(html)) {
    errors.push('Inline styles are not allowed.');
  }

  // Find all opening/closing tags
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  let match;
  while ((match = tagPattern.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      errors.push(`Tag <${tag}> is not allowed. Allowed: ${[...ALLOWED_TAGS].join(', ')}.`);
    }
  }

  const unique = [...new Set(errors)];
  return { valid: unique.length === 0, errors: unique };
}

// ─── Get all templates ─────────────────────────────────────────
const getAllTemplates = async () => {
  return ContentTemplate.find({ isActive: true })
    .select('-revisions')
    .sort({ templateType: 1 })
    .lean();
};

// ─── Get single by type ────────────────────────────────────────
const getTemplateByType = async (templateType) => {
  const doc = await ContentTemplate.findOne({ templateType, isActive: true })
    .populate('createdBy updatedBy', 'name email')
    .lean();
  if (!doc) {
    const err = new Error(`Template "${templateType}" not found`);
    err.statusCode = 404;
    throw err;
  }
  return doc;
};

// ─── Get single by id ──────────────────────────────────────────
const getTemplateById = async (id) => {
  const doc = await ContentTemplate.findById(id)
    .populate('createdBy updatedBy', 'name email')
    .populate('revisions.savedBy', 'name email')
    .lean();
  if (!doc) {
    const err = new Error('Template not found');
    err.statusCode = 404;
    throw err;
  }
  return doc;
};

// ─── Create ────────────────────────────────────────────────────
const createTemplate = async (data, userId) => {
  const { valid, errors } = validateHtml(data.htmlContent);
  if (!valid) {
    const err = new Error(errors.join(' | '));
    err.statusCode = 422;
    throw err;
  }

  const doc = await ContentTemplate.create({
    ...data,
    createdBy: userId,
    updatedBy: userId,
  });
  return doc;
};

// ─── Update (saves current version to revisions) ─────────────
const updateTemplate = async (id, data, userId, note = '') => {
  const doc = await ContentTemplate.findById(id);
  if (!doc) {
    const err = new Error('Template not found');
    err.statusCode = 404;
    throw err;
  }

  if (data.htmlContent && data.htmlContent !== doc.htmlContent) {
    const { valid, errors } = validateHtml(data.htmlContent);
    if (!valid) {
      const err = new Error(errors.join(' | '));
      err.statusCode = 422;
      throw err;
    }

    // Push current content to revisions (keep max 20)
    doc.revisions.unshift({ htmlContent: doc.htmlContent, savedBy: userId, note });
    if (doc.revisions.length > MAX_REVISIONS) {
      doc.revisions = doc.revisions.slice(0, MAX_REVISIONS);
    }
  }

  Object.assign(doc, data, { updatedBy: userId });
  await doc.save();
  return doc;
};

// ─── Restore a revision ────────────────────────────────────────
const restoreRevision = async (templateId, revisionIndex, userId) => {
  const doc = await ContentTemplate.findById(templateId);
  if (!doc) {
    const err = new Error('Template not found');
    err.statusCode = 404;
    throw err;
  }

  const revision = doc.revisions[revisionIndex];
  if (!revision) {
    const err = new Error('Revision not found');
    err.statusCode = 404;
    throw err;
  }

  // Push current content to revisions before restoring
  doc.revisions.unshift({
    htmlContent: doc.htmlContent,
    savedBy: userId,
    note: 'Auto-saved before restore',
  });
  if (doc.revisions.length > MAX_REVISIONS) {
    doc.revisions = doc.revisions.slice(0, MAX_REVISIONS);
  }

  doc.htmlContent = revision.htmlContent;
  doc.updatedBy = userId;
  await doc.save();
  return doc;
};

// ─── Soft-delete ───────────────────────────────────────────────
const deleteTemplate = async (id) => {
  const doc = await ContentTemplate.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!doc) {
    const err = new Error('Template not found');
    err.statusCode = 404;
    throw err;
  }
  return { message: 'Template deleted successfully' };
};

// ─── Render: inject data into placeholders ────────────────────
/**
 * @param {string} html  – raw template htmlContent
 * @param {Object} vars  – key/value map, values may be plain strings or HTML strings
 * @returns {string} rendered HTML
 */
const renderTemplate = (html, vars = {}) => {
  return html.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
};

module.exports = {
  getAllTemplates,
  getTemplateByType,
  getTemplateById,
  createTemplate,
  updateTemplate,
  restoreRevision,
  deleteTemplate,
  renderTemplate,
  validateHtml,
};

// MukonoTalks

