/**
 * Product service layer
 * Business logic for products — backend-driven filtering
 * Search analytics integration for BI tracking
 * @module modules/products/product.service
 */

const Product = require('./product.model');
const { paginate, paginationMeta, buildSort } = require('../../utils/helpers');
const { env } = require('../../config/env');
const AnalyticsService = require('../analytics/analytics.service');
const RedirectService = require('../seo-redirects/redirect.service');
const logger = require('../../utils/logger');
const { localizeDoc } = require('../../utils/localize');
const translationService = require('../../services/translationService');

/**
 * Get all products with backend-driven filtering
 * Tech specs stripped for unauthenticated users
 * Search terms tracked for BI analytics
 */
const getProducts = async (query, isAuthenticated = false, isAdmin = false) => {
  const { page, limit, skip } = paginate(query.page, query.limit);
  const sort = buildSort(query.sort, ['title', 'price', 'createdAt', 'stock']);

  // Build filter — ALL filtering is backend-driven
  const filter = { isActive: true };

  if (query.category) filter.category = query.category;
  if (query.industry) filter.industriesServed = { $in: [query.industry] };
  if (query.resinType) filter.resinType = query.resinType;
  if (query.pigmentType) filter.pigmentType = query.pigmentType;

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  if (query.inStock === true || query.inStock === 'true') {
    filter.stock = { $gt: 0 };
  }

  // Only published products for public; admins see all unless they filter explicitly
  if (query.publishStatus && query.publishStatus !== 'all') {
    filter.publishStatus = query.publishStatus;
  } else if (!isAdmin) {
    filter.publishStatus = 'published';
  }

  if (query.availability) filter.availability = query.availability;

  // Text search with sanitization
  if (query.search) {
    const sanitizedSearch = String(query.search).trim().substring(0, 200);
    if (sanitizedSearch.length > 0) {
      filter.$text = { $search: sanitizedSearch };
    }
  }

  // Technical keyword filter
  if (query.keyword) {
    filter.technicalKeywords = { $in: [query.keyword] };
  }

  // CAS number search
  if (query.cas) {
    filter.casNumber = { $regex: query.cas, $options: 'i' };
  }

  // Select fields — strip restricted data for unauthenticated users
  let selectFields = '-__v';
  if (!isAuthenticated) {
    selectFields += ' -technicalSpecifications';
  }

  // If pricing requires login, strip price for unauthenticated
  if (env.REQUIRE_LOGIN_FOR_PRICING && !isAuthenticated) {
    selectFields += ' -price -variants.price';
  }

  // Use text score for relevance sorting when searching
  let sortObj = sort;
  if (query.search && filter.$text) {
    sortObj = { score: { $meta: 'textScore' }, ...sort };
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select(query.search && filter.$text ? { ...Object.fromEntries(selectFields.split(' ').map(f => [f.replace('-',''), f.startsWith('-') ? 0 : 1])), score: { $meta: 'textScore' } } : selectFields)
      .populate('category', 'name slug')
      .sort(sortObj)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  // Fire-and-forget: track search for analytics
  if (query.search) {
    AnalyticsService.trackSearch(query.search, {
      resultsCount: total,
      filters: { category: query.category, industry: query.industry },
      language: query.lang || 'en',
    });
  }

  return {
    products: products.map((p) => localizeDoc(p.toObject ? p.toObject() : p, query.lang || 'en')),
    pagination: paginationMeta(total, page, limit),
  };
};

/**
 * Get single product by slug
 * Tech specs restricted to authenticated users
 * Tracks product views for analytics
 */
const getProductBySlug = async (slug, isAuthenticated = false, lang = 'en') => {
  let query = Product
    .findOne({ slug, isActive: true, publishStatus: 'published' })
    .populate('category', 'name slug')
    .populate('relatedProducts', 'title slug images category availability publishStatus')
    .populate('applicationRefs', 'title slug description industryUse advantages seoTitle seoDescription');

  if (!isAuthenticated) {
    query = query.select('-technicalSpecifications -__v');
  }

  if (env.REQUIRE_LOGIN_FOR_PRICING && !isAuthenticated) {
    query = query.select('-price -variants.price');
  }

  const product = await query;

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  return localizeDoc(product.toObject(), lang);
};

/**
 * Get single product by ID (admin)
 */
const getProductById = async (productId) => {
  const product = await Product
    .findById(productId)
    .populate('category', 'name slug')
    .populate('relatedProducts', 'title slug images category availability publishStatus')
    .populate('applicationRefs', 'title slug description industryUse advantages seoTitle seoDescription');

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  return product;
};

/**
 * Inject Swahili and Chinese translations into product data before saving.
 * Only translates fields where sw/zh are absent (never overwrites existing translations).
 * Silently skips if the Google Translate API key is not configured.
 *
 * @param {object} data - Product data object (mutated in-place)
 */
async function _injectProductTranslations(data) {
  if (!process.env.GOOGLE_TRANSLATE_API_KEY) return;

  try {
    // Determine the source English text for each field
    const enTitle = data.localizedTitle?.en || data.title;
    const enDescription = data.localizedDescription?.en || data.description;

    const fieldsToTranslate = {};
    if (enTitle) fieldsToTranslate.title = enTitle;
    if (enDescription) fieldsToTranslate.description = enDescription;

    if (Object.keys(fieldsToTranslate).length === 0) return;

    // Build existing translations so we don't re-translate what's already there
    const existing = {
      title: {
        sw: data.localizedTitle?.sw || '',
        zh: data.localizedTitle?.zh || '',
      },
      description: {
        sw: data.localizedDescription?.sw || '',
        zh: data.localizedDescription?.zh || '',
      },
    };

    const translations = await translationService.translateFields(fieldsToTranslate, existing);

    // Inject translations into localizedTitle
    if (translations.title) {
      if (!data.localizedTitle) data.localizedTitle = {};
      if (!data.localizedTitle.en) data.localizedTitle.en = enTitle;
      if (translations.title.sw) data.localizedTitle.sw = translations.title.sw;
      if (translations.title.zh) data.localizedTitle.zh = translations.title.zh;
    }

    // Inject translations into localizedDescription
    if (translations.description) {
      if (!data.localizedDescription) data.localizedDescription = {};
      if (!data.localizedDescription.en) data.localizedDescription.en = enDescription;
      if (translations.description.sw) data.localizedDescription.sw = translations.description.sw;
      if (translations.description.zh) data.localizedDescription.zh = translations.description.zh;
    }
  } catch (err) {
    // Translation is non-fatal — log and continue
    logger.warn(`[ProductService] Auto-translation failed (non-fatal): ${err.message}`);
  }
}

/**
 * Create product (admin)
 */
const createProduct = async (productData) => {
  await _injectProductTranslations(productData);
  const product = await Product.create(productData);
  return product;
};

/**
 * Update product (admin)
 * Detects slug changes and queues a redirect request for admin approval.
 */
const updateProduct = async (productId, updateData) => {
  // Capture the old slug BEFORE the update
  const existing = await Product.findById(productId).select('slug');
  if (!existing) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
  const oldSlug = existing.slug;

  // Auto-translate if English content is present in the update payload
  await _injectProductTranslations(updateData);

  const product = await Product.findByIdAndUpdate(productId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  // Auto-queue redirect requests for all language routes if slug changed
  if (oldSlug && product.slug && product.slug !== oldSlug) {
    const LANGS = ['en', 'zh', 'sw'];
    const redirectTasks = LANGS.map((lang) =>
      RedirectService.createRedirect({
        fromPath: `/${lang}/products/${oldSlug}`,
        toPath: `/${lang}/products/${product.slug}`,
        statusCode: 301,
        source: 'auto',
        resourceType: 'product',
        resourceId: product._id,
      }).catch((err) => logger.warn('[ProductService] Failed to queue redirect:', err.message))
    );
    await Promise.all(redirectTasks);
  }

  return product;
};

/**
 * Delete product (admin — soft delete by setting isActive=false)
 */
const deleteProduct = async (productId) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    { isActive: false },
    { new: true }
  );

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  return { message: 'Product deactivated successfully' };
};

/**
 * Bulk delete products (admin — soft delete by setting isActive=false)
 * @param {string[]} ids - Array of product IDs
 */
const bulkDeleteProducts = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    const error = new Error('No product IDs provided');
    error.statusCode = 400;
    throw error;
  }

  const result = await Product.updateMany(
    { _id: { $in: ids } },
    { isActive: false }
  );

  return { message: `${result.modifiedCount} product(s) deactivated successfully`, count: result.modifiedCount };
};

/**
 * Reduce stock after confirmed payment (webhook-triggered only)
 * @param {Array} items - Array of { productId, variantId, quantity }
 */
const reduceStock = async (items) => {
  const operations = items.map((item) => {
    if (item.variantId) {
      return Product.updateOne(
        { _id: item.productId, 'variants._id': item.variantId },
        { $inc: { 'variants.$.stock': -item.quantity } }
      );
    }
    return Product.updateOne(
      { _id: item.productId },
      { $inc: { stock: -item.quantity } }
    );
  });

  await Promise.all(operations);
};

/**
 * Get available filter options (for frontend filter dropdowns — driven by actual data)
 */
const getFilterOptions = async () => {
  const [industries, resinTypes, pigmentTypes, technicalKeywords, categories] = await Promise.all([
    Product.distinct('industriesServed', { isActive: true }),
    Product.distinct('resinType', { isActive: true, resinType: { $ne: null } }),
    Product.distinct('pigmentType', { isActive: true, pigmentType: { $ne: null } }),
    Product.distinct('technicalKeywords', { isActive: true }),
    require('../categories/category.model').find({ isActive: true }).select('name slug').lean(),
  ]);

  return { industries, resinTypes, pigmentTypes, technicalKeywords, categories };
};

module.exports = {
  getProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  reduceStock,
  getFilterOptions,
};

// MukonoTalks

