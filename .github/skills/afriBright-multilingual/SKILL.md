---
name: mukonotalks-multilingual
description: 'Full knowledge base for the MukonoTalks multilingual architecture (en/sw/zh). Use when: adding new translatable CMS fields, extending the translation queue, debugging geo-targeting, checking translation status, wiring a new model into the multilingual system, working on i18n, hreflang, language detection, cookie language persistence, or any feature touching multilingual content. Contains complete project state snapshot so no file-reading pass is needed.'
argument-hint: 'Describe the feature or model you want to add multilingual support for'
---

# MukonoTalks — Multilingual Architecture Skill

## Quick Facts (no file-reading needed)

- **Languages**: `en` (default), `sw` (Kiswahili), `zh` (Chinese Simplified)
- **Stack**: Express + Mongoose + BullMQ backend | React 18 + Vite + i18next frontend
- **Translation engine**: Google Cloud Translate v2 (`@google-cloud/translate`), API key in env
- **Queue**: BullMQ + ioredis; falls back to in-process `setImmediate` when Redis down
- **Country mapping**: UG→en, KE→sw, TZ→sw, RW→sw, CN→zh, TW→zh, HK→zh, SG→zh

See [Architecture](./references/architecture.md) | [Models](./references/models.md) | [Patterns](./references/patterns.md)

---

## When to Use This Skill

| Trigger | Action |
|---------|--------|
| Adding a new CMS model with translatable content | Follow [Add New Model](#add-new-model) |
| Adding a new translatable field to an existing model | Follow [Add Field to Existing Model](#add-field-to-existing-model) |
| Debugging why geo-detection returns the wrong language | See [Geo Detection Flow](#geo-detection-flow) |
| Building admin UI for a model that has translatable content | Use `TranslationStatusBadge` component |
| Adding hreflang to a new page route | Use `HreflangTags` component |
| Checking if translation queue is running | See [Queue Health](#queue-health) |
| Publishing content that requires all translations complete | See [Strict Publish Gate](#strict-publish-gate) |
| Admin reviewing/approving Google-translated content | Use `/admin/translation-dashboard` → Approval tab in `AdminTranslationDashboard.jsx` |
| Using shadcn-style cards or badges in admin UI | Use `card.jsx` / `badge.jsx` from `components/ui/` + `cn()` from `lib/utils.js` |

---

## shadcn/ui Components (added March 2026)

Dependencies: `recharts`, `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-slot`

| File | Exports | Usage |
|------|---------|-------|
| `client/src/lib/utils.js` | `cn(...inputs)` | clsx + tailwind-merge for className merging |
| `client/src/components/ui/card.jsx` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter | shadcn-style card layout |
| `client/src/components/ui/badge.jsx` | Badge (variant prop) | Variants: default, secondary, destructive, success, warning, info, outline |

```jsx
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

<Card>
  <CardHeader><CardTitle>My Section</CardTitle></CardHeader>
  <CardContent>
    <Badge variant="success">Approved</Badge>
    <Badge variant="destructive">Failed</Badge>
  </CardContent>
</Card>
```

---

## Translation Approval Flow (added March 2026)

Admin approval is separate from `translationStatus`. Completion just means Google translated it; approval means a human verified it.

```
translationStatus.sw = 'completed'           ← Google Translate finished
translationMeta.approvedAt.sw = Date         ← Admin approved it
translationMeta.approvedBy.sw = 'admin@...'  ← Who approved
```

### API Endpoints

| Method | Path | Body / Query | Description |
|--------|------|-------------|-------------|
| GET | `/api/translation/pending` | — | All docs with pending/failed sw or zh |
| PUT | `/api/translation/approve` | `{model, docId, lang}` | Mark lang as approved |
| PUT | `/api/translation/edit-field` | `{model, docId, fieldPath, lang, value}` | Correct a translated field (fieldPath validated against SUPPORTED_MODELS allowlist) |

### Admin page

- Route: `/admin/translation-dashboard` → Approval tab
- Component: `client/src/pages/admin/AdminTranslationDashboard.jsx`
- Features: expand per doc → review SW/ZH → inline edit → approve button

### adminService methods

```js
adminService.getPendingTranslations()
adminService.approveTranslation({ model, docId, lang })
adminService.editLocalizedField({ model, docId, fieldPath, lang, value })
adminService.retranslateDocument({ model, docId, force: true })
adminService.getTrafficOverview({ days })
adminService.getZeroResultSearches({ limit, days })
```

---

## Architecture Layers

### Layer 1 — UI Strings (React i18n)
- Keys-based JSON files: `client/src/locales/{en,sw,zh}.json`
- i18next 23 + react-i18next 14
- Config: `client/src/i18n.js`
- Detection order: `path → cookie → localStorage → navigator`
- Cookie name: `lang` | localStorage key: `mukonoTalksLang`

### Layer 2 — CMS Content (MongoDB + Google Translate)
- Every translatable field stored as `localized{Field}: { en, sw, zh }`
- `localizeDoc(doc, lang)` resolves to requested lang or falls back to `en`
- Google Translate auto-translates sw + zh on save/update via BullMQ queue

---

## Add New Model

Follow all steps in order:

### Step 1 — Mongoose Schema
Add these fields to the model schema (after existing content fields):

```js
translationStatus: {
  en: { type: String, enum: ['pending','processing','completed','failed'], default: 'completed' },
  sw: { type: String, enum: ['pending','processing','completed','failed'], default: 'pending' },
  zh: { type: String, enum: ['pending','processing','completed','failed'], default: 'pending' },
},
translationMeta: {
  sourceLanguage: { type: String, default: 'en' },
  translatedAt: { sw: Date, zh: Date },
  provider:     { sw: String, zh: String },
},
translationHash: { en: String },
```

Also add localized sub-documents for each text field:
```js
localizedTitle: { en: String, sw: String, zh: String },
// ... one per translatable field
```

### Step 2 — translation.queue.js `MODEL_FIELD_MAP`
File: `server/src/queues/translation.queue.js`

Add entry to `MODEL_FIELD_MAP`:
```js
MyModel: {
  Model: require('../modules/mymodel/mymodel.model'),
  fields: ['title', 'description'],           // plain string fields
  localizedFields: ['localizedTitle', 'localizedDescription'], // target localized sub-docs
},
```

### Step 3 — translation.controller.js `SUPPORTED_MODELS`
File: `server/src/modules/translation/translation.controller.js`

Add to `SUPPORTED_MODELS`:
```js
MyModel: {
  Model: require('../modules/mymodel/mymodel.model'),
  fields: ['title', 'description'],
},
```

### Step 4 — Call `enqueueTranslation` on save
In the model's service or route handler, after saving a doc:
```js
const { enqueueTranslation } = require('../../queues/translation.queue');
await enqueueTranslation('MyModel', doc._id.toString(), { title: doc.title, description: doc.description });
```

### Step 5 — Use `localizeDoc` in public API
```js
const { localizeDoc } = require('../../utils/localize');
const lang = req.resolvedLang || 'en';
return localizeDoc(doc.toObject(), lang);
```

---

## Add Field to Existing Model

1. Add `localized{Field}: { en, sw, zh }` to the schema
2. Add field name to `MODEL_FIELD_MAP[ModelName].fields` in `translation.queue.js`
3. Add field name to `SUPPORTED_MODELS[ModelName].fields` in `translation.controller.js`
4. Run translation queue job or manual translate via `POST /api/translation/translate`

---

## Geo Detection Flow

```
Browser request
  └─► GeoRedirect.jsx calls detectUserGeo()
        └─► GET /api/i18n/resolve   (backend)
              1. URL :lang param
              2. Cookie "lang"
              3. CF-IPCountry header   ← zero latency, set by Cloudflare
              4. Accept-Language header
              5. Default: "en"
              └─► Returns { language, source, country }
        └─► saveLanguagePreference(lang)  ← writes cookie + localStorage
        └─► i18n.changeLanguage(lang)
        └─► navigate(/{lang}/...)
```

Frontend files:
- `client/src/utils/geoTargeting.js` — all geo detection + cookie helpers
- `client/src/components/i18n/GeoRedirect.jsx` — React component that drives detection
- `client/src/i18n.js` — i18next config with detection order

Backend files:
- `server/src/modules/i18n/i18n.controller.js` — `resolveLanguage()` + HTTP handler
- `server/src/middlewares/language.middleware.js` — attaches `req.resolvedLang` to all requests

---

## Strict Publish Gate

Pages (and can be extended to products) enforce: **sw + zh must be `completed`** before publish.

Location: `server/src/modules/pages/page.service.js` → `publishPage()`

Error thrown: `{ message: '...', code: 'TRANSLATION_INCOMPLETE' }`

To replicate for products, add the same check to the product service `publishProduct()`.

---

## Queue Health

Check queue status via:
```
GET /api/translation/document-status?model=Product&docId=<id>
```

Retry failed translations:
```
POST /api/translation/translate
{ "model": "Product", "docId": "<id>", "force": true }
```

Translation status lifecycle: `pending → processing → completed | failed`

Idempotency: queue uses SHA-256 of source fields (`translationHash.en`). If hash matches the stored hash, the job is skipped (content unchanged).

Backoff: 1 min → 5 min → 20 min (3 attempts max).

---

## Components Reference

| Component | Path | Purpose |
|-----------|------|---------|
| `HreflangTags` | `client/src/seo/components/HreflangTags.jsx` | Injects hreflang alternate links for en/sw/zh + x-default |
| `TranslationStatusBadge` | `client/src/components/admin/TranslationStatusBadge.jsx` | Colored badges per lang (pending/processing/completed/failed); compact mode for tables |
| `GeoRedirect` | `client/src/components/i18n/GeoRedirect.jsx` | Detects language from backend, saves preference, redirects |
| `SeoHead` | `client/src/seo/components/SeoHead.tsx` | Meta tags + accepts `hreflang` prop as `Record<string, string>` |
| `LanguageSwitcher` | `client/src/components/ui/LanguageSwitcher.jsx` | UI control for manual language change |

### HreflangTags Usage
```jsx
// Auto-detects current path from React Router location:
<HreflangTags />

// Explicit path (no lang prefix needed):
<HreflangTags path="/products/colorex-paint" />
```

### TranslationStatusBadge Usage
```jsx
// Full detail (document edit panels):
<TranslationStatusBadge
  translationStatus={doc.translationStatus}
  onRetry={(lang) => handleRetry(doc._id, lang)}
/>

// Compact (table cells):
<TranslationStatusBadge translationStatus={doc.translationStatus} compact />
```

---

## Environment Variables Required

```env
# Server
GOOGLE_TRANSLATE_API_KEY=...
REDIS_URL=redis://...          # optional — falls back to in-process queue

# Client
VITE_PUBLIC_URL=https://mukonotalks.ug  # used by HreflangTags for absolute URLs
VITE_API_BASE_URL=https://api.mukonotalks.ug
```
