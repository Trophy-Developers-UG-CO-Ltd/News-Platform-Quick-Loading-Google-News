const HomepageSection = require('./homepageSection.model');
const logger = require('../../utils/logger');
const translationService = require('../../services/translationService');

/**
 * Auto-translate homepage section heading and item text fields.
 * Translates heading eyebrow, title, description;
 * and for each item: title, description.
 * Only fills missing sw/zh — never overwrites existing translations.
 *
 * @param {object} data  Section data object (mutated in-place)
 */
async function _injectSectionTranslations(data) {
  if (!process.env.GOOGLE_TRANSLATE_API_KEY && !process.env.AI_TRANSLATION_API_KEY) return;

  try {
    const fieldsToTranslate = {};
    const existing = {};

    // Heading fields
    if (data.heading) {
      const h = data.heading;
      if (h.eyebrow) {
        fieldsToTranslate.headingEyebrow = h.eyebrow;
        existing.headingEyebrow = { sw: h.localizedEyebrow?.sw || '', zh: h.localizedEyebrow?.zh || '' };
      }
      if (h.title) {
        fieldsToTranslate.headingTitle = h.title;
        existing.headingTitle = { sw: h.localizedTitle?.sw || '', zh: h.localizedTitle?.zh || '' };
      }
      if (h.description) {
        fieldsToTranslate.headingDescription = h.description;
        existing.headingDescription = { sw: h.localizedDescription?.sw || '', zh: h.localizedDescription?.zh || '' };
      }
    }

    if (Object.keys(fieldsToTranslate).length > 0) {
      const translations = await translationService.translateFields(fieldsToTranslate, existing);

      if (data.heading) {
        if (!data.heading.localizedEyebrow) data.heading.localizedEyebrow = {};
        if (!data.heading.localizedTitle) data.heading.localizedTitle = {};
        if (!data.heading.localizedDescription) data.heading.localizedDescription = {};

        for (const lang of translationService.TARGET_LANGS) {
          if (translations.headingEyebrow?.[lang]) data.heading.localizedEyebrow[lang] = translations.headingEyebrow[lang];
          if (translations.headingTitle?.[lang]) data.heading.localizedTitle[lang] = translations.headingTitle[lang];
          if (translations.headingDescription?.[lang]) data.heading.localizedDescription[lang] = translations.headingDescription[lang];
        }
      }
    }

    // Item-level translations
    if (Array.isArray(data.items) && data.items.length > 0) {
      for (const item of data.items) {
        const itemFields = {};
        const itemExisting = {};

        if (item.title) {
          itemFields.title = item.title;
          itemExisting.title = { sw: item.localizedTitle?.sw || '', zh: item.localizedTitle?.zh || '' };
        }
        if (item.description) {
          itemFields.description = item.description;
          itemExisting.description = { sw: item.localizedDescription?.sw || '', zh: item.localizedDescription?.zh || '' };
        }

        if (Object.keys(itemFields).length === 0) continue;

        const t = await translationService.translateFields(itemFields, itemExisting);

        if (t.title) {
          if (!item.localizedTitle) item.localizedTitle = {};
          if (t.title.sw) item.localizedTitle.sw = t.title.sw;
          if (t.title.zh) item.localizedTitle.zh = t.title.zh;
        }
        if (t.description) {
          if (!item.localizedDescription) item.localizedDescription = {};
          if (t.description.sw) item.localizedDescription.sw = t.description.sw;
          if (t.description.zh) item.localizedDescription.zh = t.description.zh;
        }
      }
    }
  } catch (err) {
    logger.warn(`[HomepageSectionService] Auto-translation failed (non-fatal): ${err.message}`);
  }
}

/**
 * Return one section by key (public — used by frontend).
 */
exports.getSection = async (sectionKey) => {
  return HomepageSection.findOne({ sectionKey });
};

/**
 * Return all sections sorted by order (admin use).
 */
exports.getAllSections = async () => {
  return HomepageSection.find().sort({ order: 1 });
};

/**
 * Create or fully replace a section's content.
 * Upsert so the admin never needs to "create" manually.
 */
exports.upsertSection = async (sectionKey, data) => {
  await _injectSectionTranslations(data);
  return HomepageSection.findOneAndUpdate(
    { sectionKey },
    { $set: { ...data, sectionKey } },
    { new: true, upsert: true, runValidators: true }
  );
};
