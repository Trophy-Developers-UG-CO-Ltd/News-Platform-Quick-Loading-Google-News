/**
 * Application service layer
 * Business logic for product applications
 * @module modules/applications/application.service
 */

const Application = require('./application.model');
const slugify     = require('slugify');

const makeSlug = (text) => slugify(text, { lower: true, strict: true });

/**
 * List/search applications (public + admin)
 */
const getApplications = async ({ search, page = 1, limit = 20, includeInactive = false } = {}) => {
  const filter = includeInactive ? {} : { isActive: true };

  if (search && search.trim().length >= 1) {
    const sanitized = String(search).trim().substring(0, 100);
    filter.$or = [
      { title:       { $regex: sanitized, $options: 'i' } },
      { description: { $regex: sanitized, $options: 'i' } },
      { industryUse: { $regex: sanitized, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [applications, total] = await Promise.all([
    Application.find(filter).sort({ title: 1 }).skip(skip).limit(Number(limit)),
    Application.countDocuments(filter),
  ]);

  return {
    applications,
    pagination: {
      page:       Number(page),
      limit:      Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

/**
 * Get application by slug (public)
 */
const getApplicationBySlug = async (slug) => {
  return Application.findOne({ slug, isActive: true })
    .populate('recommendedProducts', 'title slug images availability');
};

/**
 * Get application by ID (admin)
 */
const getApplicationById = async (id) => {
  return Application.findById(id)
    .populate('recommendedProducts', 'title slug images');
};

/**
 * Create application (admin)
 * Slug auto-derived from title if not provided
 */
const createApplication = async (data) => {
  const slug = data.slug ? makeSlug(data.slug) : makeSlug(data.title);
  return Application.create({ ...data, slug });
};

/**
 * Update application (admin)
 */
const updateApplication = async (id, data) => {
  if (data.slug) data.slug = makeSlug(data.slug);
  return Application.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

/**
 * Soft-delete application (admin)
 */
const deleteApplication = async (id) => {
  return Application.findByIdAndUpdate(id, { isActive: false }, { new: true });
};

module.exports = {
  getApplications,
  getApplicationBySlug,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
};

// MukonoTalks

