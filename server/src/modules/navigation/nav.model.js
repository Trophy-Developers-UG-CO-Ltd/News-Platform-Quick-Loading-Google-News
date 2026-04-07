/**
 * Navigation Menu Item model
 * Admin-configurable navbar items with order, visibility, and external link support
 * @module modules/navigation/nav.model
 */

const mongoose = require('mongoose');

const navItemSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Label is required'],
      trim: true,
      maxlength: [60, 'Label cannot exceed 60 characters'],
    },
    // Localized label — falls back to `label` (EN) if not provided
    localizedLabel: {
      en: { type: String, default: null, trim: true, maxlength: 60 },
      zh: { type: String, default: null, trim: true, maxlength: 60 },
      sw: { type: String, default: null, trim: true, maxlength: 60 },
    },
    href: {
      type: String,
      required: [true, 'href is required'],
      trim: true,
      maxlength: [200, 'href cannot exceed 200 characters'],
    },
    order: {
      type: Number,
      default: 0,
      min: [0, 'Order must be non-negative'],
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    openInNewTab: {
      type: Boolean,
      default: false,
    },
    isExternal: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// ── Translation tracking ──────────────────────────────────────────────────────
navItemSchema.add({
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
});

navItemSchema.index({ order: 1 });
navItemSchema.index({ isVisible: 1 });

module.exports = mongoose.model('NavItem', navItemSchema);

// MukonoTalks

