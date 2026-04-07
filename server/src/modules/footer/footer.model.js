/**
 * Footer Settings model — singleton document (key: 'main')
 * Stores all editable footer content: tagline, link groups, contact info.
 * @module modules/footer/footer.model
 */

const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 80 },
    href:  { type: String, required: true, trim: true, maxlength: 300 },
    openInNewTab: { type: Boolean, default: false },
  },
  { _id: false }
);

const footerSchema = new mongoose.Schema(
  {
    /** Singleton key — always "main" */
    key: { type: String, default: 'main', unique: true },

    tagline: {
      type: String,
      default: 'Premium industrial chemicals, paints, coatings and color solutions for businesses across Africa.',
      maxlength: 300,
    },
    // Localized tagline — falls back to `tagline` (EN) if not set
    localizedTagline: {
      en: { type: String, default: null, maxlength: 300 },
      zh: { type: String, default: null, maxlength: 300 },
      sw: { type: String, default: null, maxlength: 300 },
    },

    quickLinks: { type: [linkSchema], default: [] },
    serviceLinks: { type: [linkSchema], default: [] },

    contactEmail:   { type: String, default: 'info@mukonotalks.ug', maxlength: 200 },
    contactPhone:   { type: String, default: '+256 (0) 700 000 000',       maxlength: 60  },
    contactAddress: { type: String, default: 'Uganda, Kenya, Tanzania',    maxlength: 200 },

    copyrightName: {
      type: String,
      default: 'MukonoTalks',
      maxlength: 100,
    },

    // ── Translation tracking ─────────────────────────────────────────────────
    translationStatus: {
      en: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'completed' },
      sw: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
      zh: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    },
    translationMeta: {
      sourceLanguage: { type: String, default: 'en' },
      translatedAt: {
        sw: { type: Date, default: null },
        zh: { type: Date, default: null },
      },
      provider: {
        sw: { type: String, default: null },
        zh: { type: String, default: null },
      },
      approvedAt: {
        sw: { type: Date, default: null },
        zh: { type: Date, default: null },
      },
      approvedBy: {
        sw: { type: String, default: null },
        zh: { type: String, default: null },
      },
    },
    translationHash: {
      en: { type: String, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FooterSettings', footerSchema);

// MukonoTalks

