# Code Patterns Reference — MukonoTalks Multilingual

## Pattern 1: Public API Handler with Language Resolution

```js
// In any public route handler:
const { localizeDoc } = require('../../utils/localize');

async function getPublicProduct(req, res) {
  const lang = req.resolvedLang || 'en';           // set by languageMiddleware
  const { slug } = req.params;

  const doc = await Product.findOne({ slug }).lean();
  if (!doc) return res.status(404).json({ error: 'Not found' });

  const localized = localizeDoc(doc, lang);

  res.json({
    ...localized,
    language: {
      requested: lang,
      served: localized._servedLang || lang,       // localizeDoc sets _servedLang on fallback
      fallback: localized._isFallback || false,
    },
  });
}
```

---

## Pattern 2: Enqueue Translation on Admin Save

```js
const { enqueueTranslation } = require('../../queues/translation.queue');

// After doc.save():
await enqueueTranslation(
  'Product',              // Must match key in MODEL_FIELD_MAP
  doc._id.toString(),
  {
    title: doc.title,
    description: doc.description,
    overview: doc.overview,
  }
);
```

`enqueueTranslation` is idempotent — if content hash unchanged, the queue job is a no-op.

---

## Pattern 3: Strict Publish Gate (copy from page.service.js)

```js
async function publishProduct(productId) {
  const doc = await Product.findById(productId);
  if (!doc) throw Object.assign(new Error('Not found'), { status: 404 });

  const incomplete = ['sw', 'zh'].filter(
    (lang) => doc.translationStatus?.[lang] !== 'completed'
  );
  if (incomplete.length > 0) {
    const err = new Error(
      `Cannot publish: translations incomplete for ${incomplete.map((l) => l.toUpperCase()).join(', ')}`
    );
    err.status = 400;
    err.code = 'TRANSLATION_INCOMPLETE';
    err.languages = incomplete;
    throw err;
  }

  doc.published = true;
  await doc.save();
  return doc;
}
```

---

## Pattern 4: Add HreflangTags to a Page Route

```jsx
// In any page component — auto-reads current path from React Router:
import HreflangTags from '../seo/components/HreflangTags';

function ProductPage() {
  return (
    <>
      <HreflangTags />
      {/* rest of page */}
    </>
  );
}
```

With an explicit path (when you know the canonical slug):
```jsx
<HreflangTags path={`/products/${product.slug}`} />
```

---

## Pattern 5: Admin Table with Translation Status Column

```jsx
import TranslationStatusBadge from '../../components/admin/TranslationStatusBadge';

// In a table row:
<td>
  <TranslationStatusBadge
    translationStatus={row.translationStatus}
    compact
    onRetry={(lang) => retranslate(row._id, lang)}
  />
</td>
```

---

## Pattern 6: Manual Retry from Admin UI

```js
// Client — call the translation API to force re-translate:
await adminService.post('/api/translation/translate', {
  model: 'Product',
  docId: product._id,
  langs: ['sw'],          // optional: target specific langs only
  force: true,            // bypass idempotency hash check
});
```

---

## Pattern 7: Read Translation Status in Admin Detail Panel

```js
// GET /api/translation/document-status?model=Product&docId=<id>
// Returns:
{
  docId: "...",
  model: "Product",
  translationStatus: { en: "completed", sw: "failed", zh: "processing" },
  translationMeta: {
    sourceLanguage: "en",
    translatedAt: { sw: null, zh: "2026-03-18T..." },
    provider: { sw: null, zh: "google" }
  },
  translationHash: { en: "a1b2c3d4e5f6a1b2" }
}
```

---

## Pattern 8: i18n UI String in Component

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('common.submit')}</button>;
}
```

Add the key to all three files: `client/src/locales/en.json`, `sw.json`, `zh.json`

---

## Pattern 9: Localized Link (language-prefixed navigation)

```jsx
import LocalizedLink from '../components/i18n/LocalizedLink';

// Automatically prepends current language to href:
<LocalizedLink to="/products">Products</LocalizedLink>
// Renders: <a href="/en/products"> (or /sw/... etc.)
```

---

## Pattern 10: Language Switcher Integration

```jsx
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import { saveLanguagePreference } from '../utils/geoTargeting';
import { useTranslation } from 'react-i18next';

function Header() {
  const { i18n } = useTranslation();

  const handleLangChange = (lang) => {
    saveLanguagePreference(lang);     // saves cookie + localStorage
    i18n.changeLanguage(lang);
    // Navigate to /{lang}/current-path
  };

  return <LanguageSwitcher onChange={handleLangChange} />;
}
```

---

## Anti-Patterns to Avoid

| ❌ Don't do this | ✅ Do this instead |
|-----------------|-------------------|
| Call `ip-api.com` or any external IP lookup | Call backend `/api/i18n/resolve` |
| Store language in localStorage only | Call `saveLanguagePreference()` — writes cookie + localStorage |
| Return raw `localized*` fields from public API | Use `localizeDoc(doc, lang)` to strip and resolve |
| Translate synchronously in the request handler | Enqueue via `enqueueTranslation()` |
| Allow publish without checking translation status | Add `TRANSLATION_INCOMPLETE` check |
| Hard-code `'en'` as the language | Use `req.resolvedLang` (set by `languageMiddleware`) |
