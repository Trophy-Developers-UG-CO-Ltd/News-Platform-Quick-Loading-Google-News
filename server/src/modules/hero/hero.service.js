const Hero = require("./hero.model");
const logger = require("../../utils/logger");
const translationService = require("../../services/translationService");

/**
 * Auto-translate hero text fields to Swahili and Chinese.
 * Translates title, eyebrow, description, and ctaText.
 * Only fills missing sw/zh — never overwrites admin-entered values.
 *
 * @param {object} data  Hero data object (mutated in-place)
 */
async function _injectHeroTranslations(data) {
  if (!process.env.GOOGLE_TRANSLATE_API_KEY) return;

  try {
    const fieldsToTranslate = {};
    const existing = {};

    const candidates = [
      { key: 'title',       localizedKey: 'localizedTitle',       plainKey: 'title'       },
      { key: 'eyebrow',     localizedKey: 'localizedEyebrow',     plainKey: 'eyebrow'     },
      { key: 'description', localizedKey: 'localizedDescription', plainKey: 'description' },
      { key: 'ctaText',     localizedKey: 'localizedCtaText',     plainKey: 'ctaText'     },
    ];

    for (const { key, localizedKey, plainKey } of candidates) {
      const enText = data[localizedKey]?.en || data[plainKey];
      if (enText) {
        fieldsToTranslate[key] = enText;
        existing[key] = {
          sw: data[localizedKey]?.sw || '',
          zh: data[localizedKey]?.zh || '',
        };
      }
    }

    if (Object.keys(fieldsToTranslate).length === 0) return;

    const translations = await translationService.translateFields(fieldsToTranslate, existing);

    for (const { key, localizedKey, plainKey } of candidates) {
      if (!translations[key]) continue;
      if (!data[localizedKey]) data[localizedKey] = {};
      const enText = data[localizedKey].en || data[plainKey];
      if (enText && !data[localizedKey].en) data[localizedKey].en = enText;
      if (translations[key].sw) data[localizedKey].sw = translations[key].sw;
      if (translations[key].zh) data[localizedKey].zh = translations[key].zh;
    }
  } catch (err) {
    logger.warn(`[HeroService] Auto-translation failed (non-fatal): ${err.message}`);
  }
}

exports.createHero = async (data) => {
  await _injectHeroTranslations(data);
  return await Hero.create(data);
}

exports.getActiveHeroes = async () => {
  return await Hero.find({ isActive: true }).sort({ order: 1 })
}

exports.getAllHeroes = async () => {
  return await Hero.find().sort({ order: 1 })
}

exports.updateHero = async (id, data) => {
  await _injectHeroTranslations(data);
  return await Hero.findByIdAndUpdate(id, data, { new: true });
}

exports.deleteHero = async (id) => {
  return await Hero.findByIdAndDelete(id)
}