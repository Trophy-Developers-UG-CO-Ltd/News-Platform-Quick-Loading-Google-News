/**
 * SEO Platform Configuration
 * Central configuration for the enterprise SEO engine.
 * @module config/seo.config
 */

const { env } = require('./env');

const seoConfig = {
  // Site identity
  siteName: process.env.SITE_NAME || 'MukonoTalks',
  siteUrl: process.env.CLIENT_URL || 'https://www.mukonotalks.ug',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'zh', 'sw'],

  // SEO scoring thresholds
  scoring: {
    excellent: 80,
    good: 60,
    needsImprovement: 40,
    poor: 0,
  },

  // Meta limits
  meta: {
    titleMin: 30,
    titleMax: 60,
    descriptionMin: 120,
    descriptionMax: 160,
    focusKeywordDensityMin: 0.5,  // %
    focusKeywordDensityMax: 2.5,  // %
    contentMinLength: 300,
    contentGoodLength: 900,
  },

  // Sitemap
  sitemap: {
    changeFrequency: {
      home: 'daily',
      product: 'weekly',
      article: 'weekly',
      page: 'monthly',
      category: 'weekly',
    },
    priority: {
      home: 1.0,
      product: 0.8,
      article: 0.7,
      page: 0.6,
      category: 0.7,
    },
    maxUrls: 50000,
  },

  // Indexing APIs
  indexing: {
    googleApiEnabled: process.env.GOOGLE_INDEXING_ENABLED === 'true',
    indexNowEnabled: process.env.INDEXNOW_ENABLED === 'true',
    indexNowKey: process.env.INDEXNOW_KEY || '',
    googleServiceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '',
  },

  // Readability
  readability: {
    fleschKincaidGoodScore: 60,
    avgSentenceLengthGood: 20,
    passiveVoiceThreshold: 10, // max % of sentences with passive voice
    transitionWordThreshold: 30, // min % of sentences with transitions
    paragraphMaxSentences: 6,
  },

  // Schema
  schema: {
    autoGenerateOnPublish: true,
    injectGlobal: true,
  },

  // Analytics
  analytics: {
    googleSearchConsoleEnabled: process.env.GSC_ENABLED === 'true',
    googleAnalyticsEnabled: process.env.GA_ENABLED === 'true',
    trackingId: process.env.GA_TRACKING_ID || '',
  },
};

module.exports = seoConfig;

// MukonoTalks

