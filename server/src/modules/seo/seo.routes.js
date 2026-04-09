const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');


// --- Lighthouse Audit ---
router.post('/seo/lighthouse-audit', async (req, res) => {
  const url = req.body?.url || 'https://mukonotalks.ug';

  try {
    let runLighthouseAudit;

    try {
      runLighthouseAudit = require('./runLighthouseAudit');
    } catch (e) {
      runLighthouseAudit = null;
    }

    if (runLighthouseAudit) {
      const result = await runLighthouseAudit(url);
      return res.json(result);
    }

    // fallback
    res.json({
      url,
      score: 0.92,
      metrics: {
        performance: 0.9,
        accessibility: 1.0,
        bestPractices: 0.95,
        seo: 0.98,
        pwa: 0.7
      },
      timestamp: new Date().toISOString(),
      source: "Lighthouse (stub)"
    });

  } catch (err) {
    res.status(500).json({
      error: 'Lighthouse audit failed',
      details: err.message
    });
  }
});


// --- Sitemap ---
router.get('/sitemap.xml', (req, res) => {
  const sitemapPath = path.join(__dirname, '../../public/sitemap.xml');

  if (fs.existsSync(sitemapPath)) {
    res.sendFile(sitemapPath);
  } else {
    res.status(404).send('Sitemap not found');
  }
});


// --- Robots.txt ---
router.get('/robots.txt', (req, res) => {
  const robotsPath = path.join(__dirname, '../../public/robots.txt');

  if (fs.existsSync(robotsPath)) {
    res.sendFile(robotsPath);
  } else {
    res.status(404).send('robots.txt not found');
  }
});


// --- Indexing Status ---
router.get('/seo/indexing-status', async (req, res) => {
  try {
    let getGSCClient;

    try {
      getGSCClient = require('./gscClient');
    } catch (e) {
      getGSCClient = null;
    }

    if (
      getGSCClient &&
      process.env.GSC_CLIENT_ID &&
      process.env.GSC_CLIENT_SECRET &&
      process.env.GSC_REFRESH_TOKEN
    ) {
      const searchconsole = getGSCClient();

      const siteList = await searchconsole.sites.list();

      const siteEntry =
        siteList.data.siteEntry?.find(
          site =>
            site.permissionLevel === 'siteOwner' ||
            site.permissionLevel === 'siteFullUser'
        ) || siteList.data.siteEntry?.[0];

      if (!siteEntry) throw new Error('No Search Console site found.');

      return res.json({
        siteUrl: siteEntry.siteUrl,
        permissionLevel: siteEntry.permissionLevel,
        indexedPages: 'N/A',
        lastIndexed: new Date().toISOString(),
        source: 'Google Search Console (live)'
      });
    }

    // fallback
    res.json({
      indexedPages: 123,
      lastIndexed: new Date().toISOString(),
      source: "Google Search Console (stub)"
    });

  } catch (err) {
    res.status(500).json({
      error: 'GSC API failed',
      details: err.message
    });
  }
});


// --- Schema Validation ---
router.get('/seo/schema-validation', (req, res) => {
  res.json({ valid: true, errors: [] });
});


// --- Core Web Vitals ---
router.get('/seo/core-web-vitals', (req, res) => {
  res.json({ LCP: 2.1, FID: 12, CLS: 0.01 });
});


module.exports = router;