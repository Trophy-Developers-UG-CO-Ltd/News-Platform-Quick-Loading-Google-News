# Architecture Reference — MukonoTalks Multilingual System

## File Map (complete)

### Backend — `server/src/`

```
server/src/
├── server.js                          ← Express app; languageMiddleware registered before /api
├── routes.js                          ← All route mounts; /api/i18n registered here
├── middlewares/
│   └── language.middleware.js         ← Attaches req.resolvedLang, req.langSource, req.detectedCountry
├── modules/
│   ├── i18n/
│   │   ├── i18n.controller.js         ← resolveLanguage() + GET /api/i18n/resolve handler
│   │   └── i18n.routes.js             ← Public route (no auth)
│   ├── translation/
│   │   ├── translation.controller.js  ← SUPPORTED_MODELS, _translateDocument, getDocumentTranslationStatus
│   │   └── translation.routes.js      ← POST /translate, GET /document-status, GET /batch-status
│   ├── pages/
│   │   ├── page.model.js              ← Has translationStatus/Meta/Hash; strict publish gate
│   │   └── page.service.js            ← publishPage() enforces sw+zh completed; getPublicPage() adds language meta
│   ├── products/
│   │   └── product.model.js           ← localizedTitle, localizedDescription, localizedOverview + status fields
│   ├── articles/
│   │   └── article.model.js           ← localizedTitle, localizedContent, localizedExcerpt + status fields
│   ├── categories/
│   │   └── category.model.js          ← localizedName, localizedDescription + status fields
│   ├── hero/
│   │   └── hero.model.js              ← localizedTitle, localizedEyebrow, etc. + status fields
│   ├── navigation/
│   │   └── nav.model.js               ← navItemSchema.add() pattern for translationStatus/Hash
│   ├── footer/
│   │   └── footer.model.js            ← localizedTagline + status fields
│   └── homepageSection/
│       └── homepageSection.model.js   ← heading.localizedEyebrow/Title/Description + status fields
├── queues/
│   └── translation.queue.js           ← BullMQ queue; MODEL_FIELD_MAP; idempotency; status lifecycle
├── services/
│   └── translationService.js          ← Google Cloud Translate v2; LRU cache 20k; concurrency 5; retry
└── utils/
    └── localize.js                    ← localizeDoc(doc, lang): resolves localized* fields to requested lang
```

### Frontend — `client/src/`

```
client/src/
├── i18n.js                            ← i18next config; detection: path→cookie→localStorage→navigator
├── locales/
│   ├── en.json                        ← UI string keys (English)
│   ├── sw.json                        ← UI string keys (Kiswahili)
│   └── zh.json                        ← UI string keys (Chinese)
├── utils/
│   └── geoTargeting.js                ← detectUserGeo(), saveLanguagePreference(), cookie/localStorage helpers
├── components/
│   ├── i18n/
│   │   ├── GeoRedirect.jsx            ← Drives geo detection on first visit; saves preference; redirects
│   │   └── LocalizedLink.jsx          ← Link wrapper that prepends /:lang
│   ├── ui/
│   │   └── LanguageSwitcher.jsx       ← Manual language selection control
│   └── admin/
│       └── TranslationStatusBadge.jsx ← EN/SW/ZH status badges; compact + retry modes
└── seo/
    └── components/
        ├── HreflangTags.jsx           ← Injects hreflang <link> tags via Helmet
        └── SeoHead.tsx                ← Full meta/OG/Twitter/hreflang via hreflang prop
```

---

## Data Flow: Content Creation → Translation

```
Admin saves document
  │
  ├─► Model saved to MongoDB (localizedTitle.en set, sw/zh empty)
  │    translationStatus: { en: 'completed', sw: 'pending', zh: 'pending' }
  │
  └─► enqueueTranslation('ModelName', docId, { title, description, ... })
        │
        ├─► _hashFields(fields) → 16-char hex SHA-256
        ├─► Stored as translationHash.en on document
        │
        └─► BullMQ job dispatched
              │
              ├─► _processJob():
              │     1. Load doc, check hash matches (idempotency skip if same)
              │     2. Set translationStatus.sw/zh = 'processing'
              │     3. Call translateFields() for each lang
              │     4. Write localized{Field}.sw / localized{Field}.zh
              │     5. Set translationStatus.sw/zh = 'completed'
              │     6. Set translationMeta.translatedAt.sw/zh = new Date()
              │     7. Set translationMeta.provider.sw/zh = 'google'
              │     8. Save translationHash.en
              │
              └─► On error: translationStatus.sw/zh = 'failed' (retried up to 3×)
```

---

## Data Flow: Public Content Request

```
GET /:lang/products/:slug
  │
  ├─► languageMiddleware: req.resolvedLang = /:lang/ param
  │
  └─► product.service.getPublicProduct(slug, lang)
        │
        └─► localizeDoc(doc, lang)
              ├─► If localized{Field}[lang] exists → use it
              └─► Else → fall back to localized{Field}.en
              Returns flat doc (localized* keys stripped)
```

---

## Language Resolution Priority

Priority | Source | Mechanism
---------|--------|----------
1 | URL | `/:lang/` route param
2 | Cookie | `lang` cookie (set by backend or `setLangCookie()`)
3 | CF-IPCountry | Cloudflare edge header (zero latency)
4 | Accept-Language | Browser header
5 | Default | `en`

---

## Country → Language Map

```js
const COUNTRY_LANGUAGE_MAP = {
  UG: 'en',  // Uganda
  KE: 'sw',  // Kenya
  TZ: 'sw',  // Tanzania
  RW: 'sw',  // Rwanda
  CN: 'zh',  // China
  TW: 'zh',  // Taiwan
  HK: 'zh',  // Hong Kong
  SG: 'zh',  // Singapore (Chinese-speaking majority)
};
```

Authoritative source: `server/src/modules/i18n/i18n.controller.js`

---

## API Endpoints (multilingual-related)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/i18n/resolve` | None | Resolve language for current request |
| POST | `/api/translation/document` | Admin | Manually translate a single document |
| GET | `/api/translation/document-status` | Admin | Get translationStatus for a doc (`?model=X&docId=Y`) |
| POST | `/api/translation/batch` | Admin | Batch translate all or one model |
| GET | `/api/translation/pending` | Admin | List all docs with pending/failed translations |
| PUT | `/api/translation/approve` | Admin | Approve a lang translation `{model, docId, lang}` |
| PUT | `/api/translation/edit-field` | Admin | Edit a localized field `{model, docId, fieldPath, lang, value}` |
| GET | `/api/pages/:lang/:slug` | None | Public page, returns `language.{requested,served,fallback}` |

## Admin UI Pages (translation-related)

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/translation-dashboard` | `AdminTranslationDashboard.jsx` | Full translation dashboard (Overview, Approval, Batch, Queue, Settings) |
| `/admin/analytics` | `AdminAnalytics.jsx` | BI charts (recharts) + GA4 widget (shadcn cards) |

## shadcn/ui Components Added

- `client/src/components/ui/card.jsx` — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `client/src/components/ui/badge.jsx` — Badge with variants (default/secondary/destructive/success/warning/info)
- `client/src/lib/utils.js` — `cn()` helper (clsx + tailwind-merge)

Dependencies added: `recharts`, `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-slot`
