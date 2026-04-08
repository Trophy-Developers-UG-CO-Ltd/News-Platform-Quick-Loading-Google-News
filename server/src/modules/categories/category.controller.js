/**
 * Category controller
 * @module modules/categories/category.controller
 */

const categoryService = require('./category.service');
const { asyncHandler } = require('../../middlewares/error.middleware');

const getAllCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

const getAllCategoriesAdmin = asyncHandler(async (req, res) => {
  try {
    const categories = await categoryService.getAllCategoriesAdmin();
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

const getCategoryTree = asyncHandler(async (req, res) => {
  try {
    const tree = await categoryService.getCategoryTree();
    res.status(200).json({ success: true, tree });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

const getCategoryBySlug = asyncHandler(async (req, res) => {
  try {
    const category = await categoryService.getCategoryBySlug(req.params.slug);
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

const createCategory = asyncHandler(async (req, res) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

const updateCategory = asyncHandler(async (req, res) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

const deleteCategory = asyncHandler(async (req, res) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

module.exports = {
  getAllCategories,
  getAllCategoriesAdmin,
  getCategoryTree,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};

// MukonoTalks

