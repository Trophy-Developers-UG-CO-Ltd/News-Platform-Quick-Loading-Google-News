const mongoose = require("mongoose")

// ─── Reusable localized string sub-schema ────────────────────────────────────
const localizedStringSchema = (required = false) => ({
  en: { type: String, default: required ? undefined : '', required: required ? [true, 'English value is required'] : false },
  zh: { type: String, default: null },
  sw: { type: String, default: null },
});

const heroSchema = new mongoose.Schema(
  {
    // Legacy plain-string fields kept for backward compatibility.
    // New multilingual content should use localizedTitle / localizedDescription / etc.
    title: { type: String, required: true },
    eyebrow: { type: String, default: '' },
    description: { type: String, required: true },
    ctaText: { type: String, required: true },
    ctaLink: { type: String, required: true },

    // ── Localized versions (en required; zh/sw optional, falls back to en) ──
    localizedTitle:       { type: localizedStringSchema(false), default: () => ({}) },
    localizedEyebrow:     { type: localizedStringSchema(false), default: () => ({}) },
    localizedDescription: { type: localizedStringSchema(false), default: () => ({}) },
    localizedCtaText:     { type: localizedStringSchema(false), default: () => ({}) },

    largeImage: { type: String, required: true },
    mobileImage: { type: String, required: true },

    textBgColor: {
      type: String,
      default: "#1E40AF",
    },

    order: {
      type: Number,
      required: true,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Visibility controls
    showEyebrow:     { type: Boolean, default: true },
    showTitle:       { type: Boolean, default: true },
    showDescription: { type: Boolean, default: true },
    showCta:         { type: Boolean, default: true },

    // Layout
    titleTag:       { type: String,  default: 'h1',   enum: ['h1', 'h2'] },
    overlayOpacity: { type: Number,  default: 30, min: 0, max: 80 },
    textAlign:      { type: String,  default: 'left', enum: ['left', 'center'] },

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
)

module.exports = mongoose.model("Hero", heroSchema)