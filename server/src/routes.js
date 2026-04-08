const express = require('express');
const router = express.Router();

const contactRoutes = require('./modules/contact/contact.routes');
const categoryRoutes = require('./modules/categories/category.routes');
const pageRoutes = require('./modules/pages/page.routes');
const articleRoutes = require('./modules/articles/article.routes');
const homepageSectionRoutes = require('./modules/homepageSection/homepageSection.routes');
const navigationRoutes = require('./modules/navigation/nav.routes');
const footerRoutes        = require('./modules/footer/footer.routes');
const seoLegacyRoutes     = require('./modules/seo-core/legacy.routes');
const seoRedirectRoutes   = require('./modules/seo-redirects/redirect.routes');
const seoMetadataRoutes   = require('./modules/seo-core/metadata.routes');
const seoAnalyzerRoutes   = require('./modules/seo-analyzer/analyzer.routes');
const schemaEngineRoutes  = require('./modules/seo-schema/schema.routes');
const internalLinksRoutes = require('./modules/seo-links/linking.routes');
const technicalSeoRoutes  = require('./modules/seo-technical/technical.routes');
const indexingRoutes      = require('./modules/seo-indexing/indexing.routes');
const imageSeoRoutes      = require('./modules/seo-media/image.routes');
const localSeoRoutes      = require('./modules/seo-media/location.routes');
const videoSeoRoutes      = require('./modules/seo-media/video.routes');
const newsSeoRoutes       = require('./modules/seo-media/news.routes');
const seoRulesRoutes      = require('./modules/seo-rules/rules.routes');
const seoAnalyticsRoutes  = require('./modules/seo-analytics/analytics.routes');
const translationRoutes   = require('./modules/translation/translation.routes');
const i18nRoutes          = require('./modules/i18n/i18n.routes');
const siteSettingsRoutes  = require('./modules/site-settings/siteSettings.routes');
const maintenanceRoutes   = require('./modules/maintenance/maintenance.routes');

router.use('/contact', contactRoutes);
router.use('/categories', categoryRoutes);
router.use('/pages', pageRoutes);
router.use('/articles', articleRoutes);
router.use('/homepage-sections', homepageSectionRoutes);
router.use('/navigation', navigationRoutes);
router.use('/footer', footerRoutes);

router.use('/seo', seoLegacyRoutes);
router.use('/redirects', seoRedirectRoutes);

router.use('/seo-metadata',    seoMetadataRoutes);
router.use('/seo-analyzer',    seoAnalyzerRoutes);
router.use('/seo-schema',      schemaEngineRoutes);
router.use('/seo-links',       internalLinksRoutes);
router.use('/technical-seo',   technicalSeoRoutes);
router.use('/seo-indexing',    indexingRoutes);
router.use('/seo-images',      imageSeoRoutes);
router.use('/seo-local',       localSeoRoutes);
router.use('/seo-video',       videoSeoRoutes);
router.use('/seo-news',        newsSeoRoutes);
router.use('/seo-rules',       seoRulesRoutes);
router.use('/seo-analytics',   seoAnalyticsRoutes);

router.use('/site-settings',   siteSettingsRoutes);
router.use('/maintenance',     maintenanceRoutes);
router.use('/translation',     translationRoutes);
router.use('/i18n',            i18nRoutes);

module.exports = router;

// MukonoTalks

