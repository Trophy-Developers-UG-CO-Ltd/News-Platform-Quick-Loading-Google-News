/**
 * Category service layer
 * @module modules/categories/category.service
 */

const mongoose = require('mongoose');
const Category = require('./category.model');
const logger = require('../../utils/logger');
const translationService = require('../../services/translationService');

/**
 * Auto-translate category name and description to Swahili and Chinese.
 * Only fills missing sw/zh — never overwrites existing translations.
 * Non-fatal: log and continue on API error.
 *
 * @param {object} data  Category data object (mutated in-place)
 */
async function _injectCategoryTranslations(data) {
  if (!process.env.GOOGLE_TRANSLATE_API_KEY) return;

  try {
    const enName = data.localizedName?.en || data.name;
    const enDescription = data.localizedDescription?.en || data.description;

    const fieldsToTranslate = {};
    if (enName) fieldsToTranslate.name = enName;
    if (enDescription) fieldsToTranslate.description = enDescription;

    if (Object.keys(fieldsToTranslate).length === 0) return;

    const existing = {
      name: { sw: data.localizedName?.sw || '', zh: data.localizedName?.zh || '' },
      description: { sw: data.localizedDescription?.sw || '', zh: data.localizedDescription?.zh || '' },
    };

    const translations = await translationService.translateFields(fieldsToTranslate, existing);

    if (translations.name) {
      if (!data.localizedName) data.localizedName = {};
      if (!data.localizedName.en) data.localizedName.en = enName;
      if (translations.name.sw) data.localizedName.sw = translations.name.sw;
      if (translations.name.zh) data.localizedName.zh = translations.name.zh;
    }

    if (translations.description) {
      if (!data.localizedDescription) data.localizedDescription = {};
      if (!data.localizedDescription.en) data.localizedDescription.en = enDescription;
      if (translations.description.sw) data.localizedDescription.sw = translations.description.sw;
      if (translations.description.zh) data.localizedDescription.zh = translations.description.zh;
    }
  } catch (err) {
    logger.warn(`[CategoryService] Auto-translation failed (non-fatal): ${err.message}`);
  }
}

/**
 * Returns all active categories as a flat list (with parent ObjectId populated).
 * The client builds the tree from this flat list for display.
 */
const getAllCategories = async () => {
  const categories = await Category.find({ isActive: true })
    .populate('products')
    .populate('parent', 'name slug')
    .sort({ sortOrder: 1, name: 1 });
  return categories;
};

/**
 * Returns the full category tree rooted at the top level.
 * Each node: { ...category, children: [...] }
 */
const getCategoryTree = async () => {
  const all = await Category.find({ isActive: true })
    .populate('products')
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const map = {};
  all.forEach((c) => { map[c._id.toString()] = { ...c, children: [] }; });

  const roots = [];
  all.forEach((c) => {
    if (c.parent) {
      const parentId = c.parent.toString();
      if (map[parentId]) map[parentId].children.push(map[c._id.toString()]);
    } else {
      roots.push(map[c._id.toString()]);
    }
  });

  return roots;
};

const getCategoryBySlug = async (slugOrId) => {
  // Try slug first
  let category = await Category.findOne({ slug: slugOrId, isActive: true });

  // Fall back to ObjectId lookup (handles categories without slugs or direct ID links)
  if (!category && mongoose.Types.ObjectId.isValid(slugOrId)) {
    category = await Category.findOne({ _id: slugOrId, isActive: true });
  }

  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }
  return category;
};

const createCategory = async (data) => {
  await _injectCategoryTranslations(data);
  const category = await Category.create(data);
  return category;
};

const updateCategory = async (id, data) => {
  // Use findById + save so the pre-save hook fires and slug is regenerated when name changes
  await _injectCategoryTranslations(data);
  const category = await Category.findById(id);
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }
  Object.assign(category, data);
  await category.save();
  return category;
};

const deleteCategory = async (id) => {
  const category = await Category.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }
  return { message: 'Category deactivated successfully' };
};

module.exports = {
  getAllCategories,
  getCategoryTree,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};

// MukonoTalks

