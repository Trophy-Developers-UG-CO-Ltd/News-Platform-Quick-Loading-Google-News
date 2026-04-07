#!/usr/bin/env node
/**
 * Translation Sync & Validation Script
 * =====================================
 * Usage:
 *   node scripts/translate-sync.js            # check for missing/extra keys
 *   node scripts/translate-sync.js --fix      # fill missing keys with [EN] fallback stubs
 *   node scripts/translate-sync.js --ci       # exit 1 if any keys are missing (for CI gates)
 *
 * Source-of-truth language: en.json
 * Target languages: zh.json (Chinese), sw.json (Kiswahili)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = resolve(__dirname, '../src/locales');

const SOURCE_LANG = 'en';
const TARGET_LANGS = ['zh', 'sw'];

const args = process.argv.slice(2);
const FIX_MODE = args.includes('--fix');
const CI_MODE = args.includes('--ci');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readLocale(lang) {
  return JSON.parse(readFileSync(resolve(LOCALES_DIR, `${lang}.json`), 'utf8'));
}

function writeLocale(lang, data) {
  writeFileSync(
    resolve(LOCALES_DIR, `${lang}.json`),
    JSON.stringify(data, null, 2) + '\n',
    'utf8'
  );
}

/** Flatten nested object to dot-path keys */
function flatKeys(obj, prefix = '') {
  return Object.keys(obj).flatMap((k) => {
    const val = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    return val && typeof val === 'object' && !Array.isArray(val)
      ? flatKeys(val, key)
      : [key];
  });
}

/** Deep-get value by dot-path */
function getDeep(obj, path) {
  return path.split('.').reduce((cur, k) => cur?.[k], obj);
}

/** Deep-set value by dot-path, creating intermediate objects as needed */
function setDeep(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]] || typeof cur[keys[i]] !== 'object') {
      cur[keys[i]] = {};
    }
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

/** Delete a key by dot-path */
function deleteDeep(obj, path) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]]) return;
    cur = cur[keys[i]];
  }
  delete cur[keys[keys.length - 1]];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const source = readLocale(SOURCE_LANG);
const sourceKeys = new Set(flatKeys(source));

let totalMissing = 0;
let totalExtra = 0;

for (const lang of TARGET_LANGS) {
  const target = readLocale(lang);
  const targetKeys = new Set(flatKeys(target));

  const missing = [...sourceKeys].filter((k) => !targetKeys.has(k));
  const extra = [...targetKeys].filter((k) => !sourceKeys.has(k));

  totalMissing += missing.length;
  totalExtra += extra.length;

  console.log(`\n── ${lang}.json ──────────────────────────────`);
  console.log(
    `  Keys: source=${sourceKeys.size}  target=${targetKeys.size}  missing=${missing.length}  extra=${extra.length}`
  );

  if (missing.length > 0) {
    console.log(`\n  Missing (${missing.length}):`);
    missing.forEach((k) => {
      const enValue = getDeep(source, k);
      console.log(`    ✗ ${k}  →  "${enValue}"`);
    });

    if (FIX_MODE) {
      console.log(`\n  Applying stubs for missing keys...`);
      missing.forEach((k) => {
        const enValue = getDeep(source, k);
        // Prefix value with language tag so it's obvious it needs a real translation
        setDeep(target, k, `[${lang.toUpperCase()}] ${enValue}`);
        console.log(`    ✓ Set ${k}`);
      });
    }
  }

  if (extra.length > 0) {
    console.log(`\n  Extra keys not in EN (${extra.length}):`);
    extra.forEach((k) => console.log(`    ! ${k}`));
  }

  if (FIX_MODE && missing.length > 0) {
    writeLocale(lang, target);
    console.log(`\n  ✓ ${lang}.json updated with ${missing.length} stub(s).`);
  }
}

console.log(`\n═══════════════════════════════════════════════`);

if (totalMissing === 0) {
  console.log(`✅ All translations are up to date.`);
} else {
  console.log(`⚠️  Total missing keys: ${totalMissing}`);
  if (!FIX_MODE) {
    console.log(`   Run with --fix to insert "[LANG] English fallback" stubs.`);
  }
}

if (CI_MODE && totalMissing > 0) {
  process.exit(1);
}
