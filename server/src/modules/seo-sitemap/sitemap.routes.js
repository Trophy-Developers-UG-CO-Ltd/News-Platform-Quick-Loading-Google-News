/**
 * Sitemap routes
 * @module modules/sitemap/sitemap.routes
 */

const express = require('express');
const router  = express.Router();
const { getSitemapIndex, getLanguageSitemap } = require('./sitemap.controller');
const SitemapService = require('./sitemap.service');

const xmlResponse = (res, xml) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(xml);
};

// Legacy language sitemap (keeps backwards compat)
router.get('/sitemap/:lang.xml', getLanguageSitemap);

// Enterprise sitemap index
router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const xml = await SitemapService.generateSitemapIndex();
    xmlResponse(res, xml);
  } catch (err) { next(err); }
});

router.get('/sitemap-pages.xml', async (req, res, next) => {
  try {
    const xml = await SitemapService.generatePagesSitemap();
    xmlResponse(res, xml);
  } catch (err) { next(err); }
});

router.get('/sitemap-products.xml', async (req, res, next) => {
  try {
    const xml = await SitemapService.generateProductsSitemap();
    xmlResponse(res, xml);
  } catch (err) { next(err); }
});

router.get('/sitemap-articles.xml', async (req, res, next) => {
  try {
    const xml = await SitemapService.generateArticlesSitemap();
    xmlResponse(res, xml);
  } catch (err) { next(err); }
});

router.get('/sitemap-categories.xml', async (req, res, next) => {
  try {
    const xml = await SitemapService.generateCategoriesSitemap();
    xmlResponse(res, xml);
  } catch (err) { next(err); }
});

router.get('/news-sitemap.xml', async (req, res, next) => {
  try {
    const xml = await SitemapService.generateNewsSitemap();
    xmlResponse(res, xml);
  } catch (err) { next(err); }
});

router.get('/video-sitemap.xml', async (req, res, next) => {
  try {
    const xml = await SitemapService.generateVideoSitemap();
    xmlResponse(res, xml);
  } catch (err) { next(err); }
});

module.exports = router;

// MukonoTalks

