const mongoose = require('mongoose');

/**
 * HomepageSection model
 * Stores admin-editable content for each homepage section.
 * sectionKey is the stable identifier (e.g. 'industries', 'faq').
 */
const itemSchema = new mongoose.Schema(
  {
    icon:        { type: String, default: '' },  // Lucide icon name, e.g. "PaintBucket"
    title:       { type: String, default: '' },  // English title (legacy)
    description: { type: String, default: '' },  // English body copy (legacy)
    link:        { type: String, default: '' },  // optional href (products section)
    label:       { type: String, default: '' },  // CTA perk short label (legacy)
    order:       { type: Number, default: 0  },
    // ── Localized fields (fall back to title/description/label if not set) ──
    localizedTitle:       { en: { type: String, default: null }, zh: { type: String, default: null }, sw: { type: String, default: null } },
    localizedDescription: { en: { type: String, default: null }, zh: { type: String, default: null }, sw: { type: String, default: null } },
    localizedLabel:       { en: { type: String, default: null }, zh: { type: String, default: null }, sw: { type: String, default: null } },
  },
  { _id: true }
);

const ctaButtonSchema = new mongoose.Schema(
  {
    text:    { type: String, default: '' },
    link:    { type: String, default: '' },
    variant: { type: String, default: 'primary', enum: ['primary', 'outline'] },
  },
  { _id: true }
);

const homepageSectionSchema = new mongoose.Schema(
  {
    sectionKey: {
      type:     String,
      required: true,
      unique:   true,
      index:    true,
      enum:     ['intro', 'values', 'featured-products', 'industries', 'products', 'advantages', 'faq', 'cta', 'video', 'opportunities', 'inquiry'],
    },
    isActive: { type: Boolean, default: true },
    order:    { type: Number,  default: 0    },

    heading: {
      eyebrow:     { type: String, default: '' },
      title:       { type: String, default: '' },
      description: { type: String, default: '' },
      // ── Localized heading fields (fall back to above if not set) ──
      localizedEyebrow:     { en: { type: String, default: null }, zh: { type: String, default: null }, sw: { type: String, default: null } },
      localizedTitle:       { en: { type: String, default: null }, zh: { type: String, default: null }, sw: { type: String, default: null } },
      localizedDescription: { en: { type: String, default: null }, zh: { type: String, default: null }, sw: { type: String, default: null } },
    },

    items:      { type: [itemSchema],     default: [] },
    ctaButtons: { type: [ctaButtonSchema], default: [] },

    // Products section — bottom CTA button
    bottomCtaText: { type: String, default: '' },
    bottomCtaLink: { type: String, default: '' },

    // Video section
    videoUrl:     { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    videoCaption: { type: String, default: '' },

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

module.exports = mongoose.model('HomepageSection', homepageSectionSchema);
