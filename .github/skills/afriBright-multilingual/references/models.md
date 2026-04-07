# Models Reference — MukonoTalks Multilingual Fields

All 8 CMS models share this translation field pattern (appended to schema):

```js
translationStatus: {
  en: { type: String, enum: ['pending','processing','completed','failed'], default: 'completed' },
  sw: { type: String, enum: ['pending','processing','completed','failed'], default: 'pending' },
  zh: { type: String, enum: ['pending','processing','completed','failed'], default: 'pending' },
},
translationMeta: {
  sourceLanguage: { type: String, default: 'en' },
  translatedAt:   { sw: Date, zh: Date },
  provider:       { sw: String, zh: String },
},
translationHash: { en: String },
```

---

## Model: Page (`page.model.js`)

Translatable fields:
- `localizedTitle: { en, sw, zh }`
- `localizedContent: { en, sw, zh }` (rich text / blocks)
- `localizedExcerpt: { en, sw, zh }`
- `localizedSeoTitle: { en, sw, zh }`
- `localizedSeoDescription: { en, sw, zh }`

Publish gate: `sw` AND `zh` must be `completed` → enforced in `page.service.js → publishPage()`

---

## Model: Product (`product.model.js`)

Translatable fields:
- `localizedTitle: { en, sw, zh }`
- `localizedDescription: { en, sw, zh }`
- `localizedOverview: { en, sw, zh }`

Queue fields (MODEL_FIELD_MAP): `['title', 'description', 'overview']`

---

## Model: Article (`article.model.js`)

Translatable fields:
- `localizedTitle: { en, sw, zh }`
- `localizedContent: { en, sw, zh }`
- `localizedExcerpt: { en, sw, zh }`

Queue: Direct injection (content blocks handled separately in translation queue)

---

## Model: Category (`category.model.js`)

Translatable fields:
- `localizedName: { en, sw, zh }`
- `localizedDescription: { en, sw, zh }`

Queue fields: `['name', 'description']`

---

## Model: Hero (`hero.model.js`)

Translatable fields:
- `localizedTitle: { en, sw, zh }`
- `localizedEyebrow: { en, sw, zh }`
- `localizedDescription: { en, sw, zh }`
- `localizedCtaText: { en, sw, zh }`

Queue fields: `['title', 'eyebrow', 'description', 'ctaText']`

---

## Model: Navigation / NavItem (`nav.model.js`)

Special pattern — `navItemSchema.add({...})` is used:
```js
navItemSchema.add({
  localizedLabel: { en: String, sw: String, zh: String },
  translationStatus: { ... },
  translationHash:   { en: String },
});
```

Queue field map key: `NavItem`
Queue fields: `['label']` → written to `localizedLabel`

---

## Model: Footer / FooterSettings (`footer.model.js`)

Translatable fields:
- `localizedTagline: { en, sw, zh }`

Queue field map key: `FooterSettings`
Queue fields: `['tagline']` → written to `localizedTagline`

---

## Model: HomepageSection (`homepageSection.model.js`)

Nested `heading` sub-document pattern:
```js
heading: {
  eyebrow: String,             // source (English)
  title: String,               // source (English)
  description: String,         // source (English)
  localizedEyebrow: { en, sw, zh },
  localizedTitle: { en, sw, zh },
  localizedDescription: { en, sw, zh },
}
```

Queue field map key: `HomepageSection`
Queue fields: `['headingEyebrow', 'headingTitle', 'headingDescription']`
→ written to `heading.localizedEyebrow`, `heading.localizedTitle`, `heading.localizedDescription`

---

## localizeDoc Utility

File: `server/src/utils/localize.js`

```js
localizeDoc(doc, lang)
```

- Strips ALL keys matching `^localized[A-Z]` from the returned object
- For each stripped key, resolves `localized{Field}[lang]` → falls back to `localized{Field}.en`
- Example: `localizedTitle` → becomes `title` in the returned object
- Returns a plain JS object (not a Mongoose document)
- Used in every public API handler that returns CMS content

---

## Translation Status Badge Colors

| Status | Color | Tailwind Classes |
|--------|-------|-----------------|
| `completed` | Green | `bg-emerald-50 text-emerald-700 border-emerald-200` |
| `processing` | Amber | `bg-amber-50 text-amber-700 border-amber-200` (icon spins) |
| `failed` | Red | `bg-red-50 text-red-700 border-red-200` (shows Retry button) |
| `pending` | Gray | `bg-gray-50 text-gray-500 border-gray-200` |
