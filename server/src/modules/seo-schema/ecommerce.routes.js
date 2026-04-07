/**
 * Ecommerce SEO routes
 * Product schema generation, price schema, rich results optimization.
 * @module modules/ecommerce-seo/ecommerce-seo.routes
 */

const express = require('express');
const router  = express.Router();
const SchemaBuilder  = require('../../utils/schema-builder');
const SchemaService  = require('./schema.service');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

const admin = [protect, authorize('admin')];

// Generate Product schema from product data
router.post('/schema/product', ...admin, async (req, res, next) => {
  try {
    const { pageSlug, product } = req.body;
    if (!pageSlug || !product) return res.status(400).json({ success: false, message: 'pageSlug and product are required' });

    const schema = SchemaBuilder.product(product);
    const saved  = await SchemaService.upsert(pageSlug, 'Product', schema, req.user?._id);
    res.json({ success: true, data: saved });
  } catch (err) { next(err); }
});

// Bulk generate product schemas from all active products
router.post('/schema/bulk-generate', ...admin, async (req, res, next) => {
  try {
    let Product;
    try { Product = require('../products/product.model'); }
    catch { return res.status(500).json({ success: false, message: 'Product module not available' }); }

    const products = await Product.find({ status: 'active' }).lean();
    const results  = [];

    for (const product of products) {
      try {
        const result = await SchemaService.generateForProduct(product, req.user?._id);
        results.push({ productId: product._id, status: 'ok', ...result });
      } catch (err) {
        results.push({ productId: product._id, status: 'error', error: err.message });
      }
    }

    res.json({ success: true, data: { total: products.length, results } });
  } catch (err) { next(err); }
});

// Check rich results eligibility for a product page
router.get('/rich-results/:pageSlug', ...admin, async (req, res, next) => {
  try {
    const doc = await SchemaService.getBySlugAndType(req.params.pageSlug, 'Product');
    const eligible = !!(doc?.schemaJSON?.offers && doc?.schemaJSON?.name);
    res.json({
      success: true,
      data: {
        eligible,
        hasOffers:  !!(doc?.schemaJSON?.offers),
        hasRating:  !!(doc?.schemaJSON?.aggregateRating),
        hasImage:   !!(doc?.schemaJSON?.image?.length),
        schema: doc?.schemaJSON || null,
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;

// MukonoTalks

