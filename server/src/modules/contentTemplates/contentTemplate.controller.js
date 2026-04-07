/**
 * ContentTemplate controller
 * @module modules/contentTemplates/contentTemplate.controller
 */

const templateService = require('./contentTemplate.service');
const { asyncHandler } = require('../../middlewares/error.middleware');
const AuditService = require('../audit/audit.service');

// GET /api/content-templates
const getAllTemplates = asyncHandler(async (req, res) => {
  const templates = await templateService.getAllTemplates();
  res.status(200).json({ success: true, templates });
});

// GET /api/content-templates/type/:type
const getTemplateByType = asyncHandler(async (req, res) => {
  const template = await templateService.getTemplateByType(req.params.type);
  res.status(200).json({ success: true, template });
});

// GET /api/content-templates/:id
const getTemplateById = asyncHandler(async (req, res) => {
  const template = await templateService.getTemplateById(req.params.id);
  res.status(200).json({ success: true, template });
});

// POST /api/content-templates
const createTemplate = asyncHandler(async (req, res) => {
  const template = await templateService.createTemplate(req.body, req.user._id);
  await AuditService.log({
    user: req.user._id,
    action: 'CREATE',
    resource: 'ContentTemplate',
    resourceId: template._id,
    details: { templateType: template.templateType },
    ip: req.ip,
  });
  res.status(201).json({ success: true, template });
});

// PUT /api/content-templates/:id
const updateTemplate = asyncHandler(async (req, res) => {
  const { note, ...data } = req.body;
  const template = await templateService.updateTemplate(req.params.id, data, req.user._id, note);
  await AuditService.log({
    user: req.user._id,
    action: 'UPDATE',
    resource: 'ContentTemplate',
    resourceId: template._id,
    details: { templateType: template.templateType },
    ip: req.ip,
  });
  res.status(200).json({ success: true, template });
});

// POST /api/content-templates/:id/restore/:revisionIndex
const restoreRevision = asyncHandler(async (req, res) => {
  const { id, revisionIndex } = req.params;
  const template = await templateService.restoreRevision(id, Number(revisionIndex), req.user._id);
  await AuditService.log({
    user: req.user._id,
    action: 'RESTORE',
    resource: 'ContentTemplate',
    resourceId: template._id,
    details: { revisionIndex: Number(revisionIndex) },
    ip: req.ip,
  });
  res.status(200).json({ success: true, template });
});

// DELETE /api/content-templates/:id
const deleteTemplate = asyncHandler(async (req, res) => {
  const result = await templateService.deleteTemplate(req.params.id);
  await AuditService.log({
    user: req.user._id,
    action: 'DELETE',
    resource: 'ContentTemplate',
    resourceId: req.params.id,
    ip: req.ip,
  });
  res.status(200).json({ success: true, ...result });
});

// GET /api/content-templates/render/:type?productId=&applicationId=
// Preview endpoint — injects real product + application data
const Product = require('../products/product.model');
const Application = require('../applications/application.model');

const renderPreview = asyncHandler(async (req, res) => {
  const template = await templateService.getTemplateByType(req.params.type);

  const { productId, applicationId } = req.query;
  const [product, application] = await Promise.all([
    productId ? Product.findById(productId).lean() : null,
    applicationId ? Application.findById(applicationId).lean() : null,
  ]);

  const vars = buildTemplateVars(product, application);
  const rendered = templateService.renderTemplate(template.htmlContent, vars);
  res.status(200).json({ success: true, html: rendered });
});

/**
 * Build the variable map used for placeholder substitution.
 * All values that represent lists are returned as <li>…</li> strings.
 */
function buildTemplateVars(product, application) {
  const li = (arr = []) => arr.map((v) => `<li>${v}</li>`).join('\n');

  return {
    product_name:        product?.title            || '',
    application_name:    application?.title         || '',
    product_description: product?.description       || product?.overview || '',
    benefits:            li(product?.benefits),
    applications:        li(product?.applications),
    curing_condition:    product?.technicalSpecifications?.curingCondition || '',
    industries:          li(product?.industriesServed),
  };
}

module.exports = {
  getAllTemplates,
  getTemplateByType,
  getTemplateById,
  createTemplate,
  updateTemplate,
  restoreRevision,
  deleteTemplate,
  renderPreview,
};

// MukonoTalks

