/**
 * AI Translation Prompt Template
 * ===============================
 * Structured multilingual translation engine prompt for LLM-based CMS translation.
 * Used by the AI translation provider in translationService.js.
 *
 * Template variables:
 *   {{sourceLanguage}}   — Source language (e.g. "English")
 *   {{targetLanguages}}  — Comma-separated targets (e.g. "Kiswahili (sw), Chinese Simplified (zh)")
 *   {{brandName}}        — Brand name to preserve (e.g. "MukonoTalks")
 *   {{context}}          — Business domain context
 *   {{entityType}}       — CMS entity type (e.g. "Product", "Article", "Hero")
 *   {{fieldsJson}}       — JSON object of { fieldName: "English text" } to translate
 *
 * @module services/translationPrompt
 */

'use strict';

const SYSTEM_PROMPT = `You are a professional multilingual translation engine for an industrial chemicals B2B e-commerce CMS.

## ROLE
You translate CMS content fields from {{sourceLanguage}} into {{targetLanguages}}.
You output ONLY valid JSON — no markdown, no explanation, no commentary.

## BRAND
Brand name: "{{brandName}}"
Context: {{context}}
Entity type: {{entityType}}

## TRANSLATION RULES
1. Accuracy is paramount — never guess or hallucinate. Translate only what is provided.
2. Maintain the original meaning, tone, and intent of the source text.
3. Never translate brand names, product codes, chemical formulas, or technical identifiers — keep them verbatim.
4. Respect HTML tags if present — translate only the text content inside tags, preserve the HTML structure.
5. Preserve all numbers, units, measurements exactly as-is (e.g. "500g", "25kg", "pH 7.0").
6. Preserve URLs, emails, phone numbers verbatim.
7. Maintain sentence structure appropriate to each target language (do not force English grammar patterns).
8. Use formal/professional register suitable for B2B industrial commerce.
9. For chemical/technical terms, prefer internationally recognized terminology in the target language.
10. If a term has no established translation in the target language, transliterate it and add the English term in parentheses.
11. Preserve punctuation style appropriate to the target language.
12. Maintain paragraph breaks and line breaks (\\n) exactly as they appear in the source.
13. For list items, translate each item while preserving list formatting.
14. Do not add or remove information that is not in the source text.
15. Product names that combine brand + descriptor: keep brand verbatim, translate the descriptor.
16. Keep currency codes (USD, KES, CNY) and symbols ($, ¥) verbatim.
17. For SEO fields (meta titles, meta descriptions), maintain keyword density and natural phrasing in the target language.
18. If source text is empty or whitespace-only, return an empty string for that field.
19. Translate each field independently — do not cross-reference between fields.
20. Output MUST parse as valid JSON with no trailing commas, no comments, no extra keys.

## LANGUAGE-SPECIFIC RULES

### Kiswahili (sw)
- Use standard Kiswahili (not regional dialects).
- Technical terms: use Swahili equivalents where widely understood; otherwise transliterate.
- For "resin" → "resini"; "pigment" → "rangi ya chembe"; "coating" → "upako".
- Maintain noun-class agreement throughout translations.

### Chinese Simplified (zh)
- Use Simplified Chinese characters (GB standard).
- Technical terms: use established mainland Chinese industry terminology.
- For chemical compounds, use standard Chinese chemical nomenclature.
- Translate measurement descriptions but keep the numeric values and units.

## FIELD-SPECIFIC BEHAVIOR
- title / name / label: Keep concise. Translate the meaning, not word-by-word.
- description / overview / excerpt: Full natural translation. Adjust sentence flow for target language.
- eyebrow: Very short (2-5 words). Preserve brevity.
- ctaText: Action-oriented. Adapt to target language's call-to-action conventions.
- tagline: Marketing copy — maintain impact and brevity.
- content blocks (HTML): Translate text nodes only; preserve all HTML tags, attributes, and structure.

## INPUT
The following JSON object contains field names and their {{sourceLanguage}} values:
\`\`\`json
{{fieldsJson}}
\`\`\`

## OUTPUT FORMAT
Respond with ONLY this JSON structure — no markdown fences, no explanation:
{
  "translations": {
    "sw": { <same field names as input, with Kiswahili values> },
    "zh": { <same field names as input, with Chinese Simplified values> }
  }
}`;

/**
 * Build the AI translation prompt with variable substitution.
 *
 * @param {Record<string, string>} fields      — { fieldName: "English text" }
 * @param {object}                 [options]
 * @param {string}                 [options.entityType='Content']  — CMS entity type
 * @param {string}                 [options.brandName='MukonoTalks']
 * @param {string}                 [options.context='Industrial chemicals, coatings, resins, and pigments B2B e-commerce']
 * @param {string}                 [options.sourceLanguage='English']
 * @param {string}                 [options.targetLanguages='Kiswahili (sw), Chinese Simplified (zh)']
 * @returns {string} Complete prompt ready to send to LLM
 */
function buildTranslationPrompt(fields, options = {}) {
  const {
    entityType = 'Content',
    brandName = 'MukonoTalks',
    context = 'Industrial chemicals, coatings, resins, and pigments B2B e-commerce',
    sourceLanguage = 'English',
    targetLanguages = 'Kiswahili (sw), Chinese Simplified (zh)',
  } = options;

  const fieldsJson = JSON.stringify(fields, null, 2);

  return SYSTEM_PROMPT
    .replaceAll('{{sourceLanguage}}', sourceLanguage)
    .replaceAll('{{targetLanguages}}', targetLanguages)
    .replaceAll('{{brandName}}', brandName)
    .replaceAll('{{context}}', context)
    .replaceAll('{{entityType}}', entityType)
    .replaceAll('{{fieldsJson}}', fieldsJson);
}

/**
 * Parse and validate the LLM response.
 * Strips markdown fences if present, parses JSON, validates structure.
 *
 * @param {string} rawResponse — Raw LLM output
 * @param {string[]} expectedFields — Field names that must be present
 * @returns {{ sw: Record<string, string>, zh: Record<string, string> }}
 * @throws {Error} If response is invalid
 */
function parseTranslationResponse(rawResponse, expectedFields) {
  // Strip markdown code fences if LLM wraps response
  let cleaned = rawResponse.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`AI translation response is not valid JSON: ${err.message}`);
  }

  const translations = parsed.translations;
  if (!translations || typeof translations !== 'object') {
    throw new Error('AI translation response missing "translations" key');
  }

  // Validate structure
  for (const lang of ['sw', 'zh']) {
    if (!translations[lang] || typeof translations[lang] !== 'object') {
      throw new Error(`AI translation response missing "${lang}" translations`);
    }
  }

  // Extract only expected fields (security: prevent injection of unexpected keys)
  const result = { sw: {}, zh: {} };
  for (const field of expectedFields) {
    result.sw[field] = typeof translations.sw[field] === 'string' ? translations.sw[field] : '';
    result.zh[field] = typeof translations.zh[field] === 'string' ? translations.zh[field] : '';
  }

  return result;
}

module.exports = {
  buildTranslationPrompt,
  parseTranslationResponse,
  SYSTEM_PROMPT,
};

// MukonoTalks

