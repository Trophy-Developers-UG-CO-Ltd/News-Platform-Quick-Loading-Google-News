/**
 * Localization helpers — MongoDB content
 * ==========================================
 * Resolves a localized value from a `{ en, zh, sw }` sub-document.
 * Falls back gracefully: requested lang → 'en' → legacy plain-string field.
 *
 * Usage in a service / controller:
 *   const { localizeField, localizeDoc } = require('../../utils/localize');
 *
 *   // Single field
 *   localizeField(product.localizedTitle, lang, product.title)
 *   // => "产品标题" (zh) or "Product Title" (en fallback)
 *
 *   // Whole document (maps all localized* keys to their base name)
 *   const loc = localizeDoc(product.toObject(), lang);
 *   // loc.title, loc.description, loc.overview, loc.features …
 *
 * @module utils/localize
 */

'use strict';

const SUPPORTED_LANGS = ['en', 'zh', 'sw'];

/**
 * Resolve a single localized field.
 * @param {object|null} localizedObj  - { en, zh, sw } sub-document (may be null/undefined)
 * @param {string}      lang          - requested language code
 * @param {*}           fallback      - plain-string (or other) legacy fallback value
 * @returns {*}
 */
function localizeField(localizedObj, lang, fallback) {
  const safeLang = SUPPORTED_LANGS.includes(lang) ? lang : 'en';

  if (localizedObj) {
    // Prefer requested lang, then English, then legacy fallback
    return localizedObj[safeLang] || localizedObj.en || fallback;
  }
  return fallback;
}

/**
 * Produce a language-resolved plain object from a Mongoose document / POJO.
 *
 * All fields following the convention `localized<FieldName>` are resolved to
 * their base name (lowerCamelCase): localizedTitle → title, etc.
 * The original `localized*` keys are removed from the output object.
 *
 * @param {object} doc   - plain JS object (call .toObject() on a Mongoose doc first)
 * @param {string} lang  - language code e.g. 'zh'
 * @returns {object}     - localized plain object
 */
function localizeDoc(doc, lang) {
  if (!doc || typeof doc !== 'object') return doc;

  const safeLang = SUPPORTED_LANGS.includes(lang) ? lang : 'en';
  const output = { ...doc };

  for (const key of Object.keys(output)) {
    if (!key.startsWith('localized')) continue;

    // e.g. "localizedTitle" → "title"
    const baseKey = key.charAt(9).toLowerCase() + key.slice(10);
    const localizedObj = output[key];

    if (localizedObj && typeof localizedObj === 'object' && !Array.isArray(localizedObj)) {
      const resolved = localizedObj[safeLang] || localizedObj.en;
      if (resolved !== undefined && resolved !== null) {
        output[baseKey] = resolved;
      }
      // Always strip the localized* key from public output
      delete output[key];
    }
  }

  return output;
}

module.exports = { localizeField, localizeDoc, SUPPORTED_LANGS };
