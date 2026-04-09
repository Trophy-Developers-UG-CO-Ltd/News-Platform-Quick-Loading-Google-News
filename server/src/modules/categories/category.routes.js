/**
 * Category routes
 * Enterprise caching on public endpoints
 * @module modules/categories/category.routes
 */

const express = require('express');
const router = express.Router();

const categoryController = require('./category.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { cacheResponse, invalidateCache } = require('../../middlewares/cache.middleware');
const { createCategorySchema, updateCategorySchema } = require('./category.validation');
const CategoryModel = require('./category.model');
const ArticleModel = require('../articles/article.model');
const { setCache, getCache, redis } = require('../../config/redis');

const HOMEPAGE_CATEGORIES_CACHE_KEY = 'homepage:v2';

const clearHomepageCategoriesCache = async () => {
  if (!redis?.del) return;

  await Promise.allSettled([
    redis.del(HOMEPAGE_CATEGORIES_CACHE_KEY),
    redis.del('homepage:categories'),
  ]);
};

// Public (cached 10 min — categories change infrequently)
router.get('/', cacheResponse(600), categoryController.getAllCategories);
router.get('/tree', cacheResponse(600), categoryController.getCategoryTree);

// ✅ FIRST (specific route)
router.get('/with-articles', async (req, res) => {
  try {
    const cached = await getCache(HOMEPAGE_CATEGORIES_CACHE_KEY);
    if (cached) {
      return res.json(cached);
    }

    const categories = await CategoryModel.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    const categoriesWithArticles = [];

    for (const category of categories) {
      const articles = await ArticleModel.find({
        category: category.slug,
        publishStatus: 'published',
      })
        .select('title excerpt localizedSlug featuredImage category publishedAt createdAt viewCount')
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(6)
        .lean();

      if (articles.length > 0) {
        categoriesWithArticles.push({
          name: category.name,
          slug: category.slug,
          articles,
        });
      }
    }

    await setCache(HOMEPAGE_CATEGORIES_CACHE_KEY, categoriesWithArticles, 120);
    return res.json(categoriesWithArticles);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Admin listing (includes inactive)
router.get('/admin/all', protect, authorize('admin'), categoryController.getAllCategoriesAdmin);

// ❗ LAST (catch-all)
router.get('/:slug', cacheResponse(600), categoryController.getCategoryBySlug);

// Admin (with cache invalidation)
router.post('/', protect, authorize('admin'), validate(createCategorySchema), invalidateCache('/api/categories', '/api/products'), async (req, res, next) => {
  await clearHomepageCategoriesCache();
  next();
}, categoryController.createCategory);
router.put('/:id', protect, authorize('admin'), validate(updateCategorySchema), invalidateCache('/api/categories', '/api/products'), async (req, res, next) => {
  await clearHomepageCategoriesCache();
  next();
}, categoryController.updateCategory);
router.delete('/:id', protect, authorize('admin'), invalidateCache('/api/categories', '/api/products'), async (req, res, next) => {
  await clearHomepageCategoriesCache();
  next();
}, categoryController.deleteCategory);

module.exports = router;
