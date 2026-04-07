/**
 * Quick Translator Page
 * Provisional frontend-only translator using LibreTranslate API
 * Used while backend translation service is being fixed
 * @module pages/TranslatorPage
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, LANGUAGE_CONFIG } from '../i18n';
import { Globe, Copy, ArrowRightLeft, Loader2 } from 'lucide-react';

const TRANSLATE_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Swahili' },
  { code: 'zh', label: 'Chinese' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German' },
  { code: 'ar', label: 'Arabic' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
];

export default function TranslatorPage() {
  const { t } = useTranslation();
  const { lang } = useParams();
  const currentLang = lang || DEFAULT_LANGUAGE;

  const [text, setText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [source, setSource] = useState('auto');
  const [target, setTarget] = useState(currentLang === 'en' ? 'sw' : 'en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    if (!text.trim()) {
      setError('Please enter text to translate.');
      setTranslatedText('');
      return;
    }

    setLoading(true);
    setError('');
    setTranslatedText('');

    try {
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source,
          target,
          format: 'text',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Translation failed.');
      }

      setTranslatedText(data.translatedText || '');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    if (source === 'auto') return;
    setSource(target);
    setTarget(source);
    setText(translatedText);
    setTranslatedText(text);
  };

  const handleCopy = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText);
    }
  };

  return (
    <div className="min-h-[60vh] bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 rounded-full mb-4">
            <Globe className="w-7 h-7 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('translator.title', 'Quick Translator')}
          </h1>
          <p className="text-gray-500 mt-2">
            {t('translator.subtitle', 'Translate text between languages instantly')}
          </p>
        </div>

        {/* Translator card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          {/* Language selector bar */}
          <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 border-b border-gray-200">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="auto">Auto Detect</option>
              {TRANSLATE_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>

            <button
              onClick={handleSwap}
              disabled={source === 'auto'}
              className="p-2 rounded-full hover:bg-gray-200 transition disabled:opacity-30"
              title="Swap languages"
            >
              <ArrowRightLeft className="w-5 h-5 text-gray-600" />
            </button>

            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {TRANSLATE_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Text areas */}
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* Source */}
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-500 mb-2">
                {t('translator.source', 'Enter text')}
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder={t('translator.placeholder', 'Type or paste text here...')}
                className="w-full resize-none rounded-lg border-0 p-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 text-[15px] leading-relaxed"
              />
              <div className="mt-2 text-xs text-gray-400 text-right">
                {text.length} chars
              </div>
            </div>

            {/* Target */}
            <div className="p-5 bg-gray-50/50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-500">
                  {t('translator.result', 'Translation')}
                </label>
                {translatedText && (
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                )}
              </div>
              <div className="min-h-[192px] text-gray-900 text-[15px] leading-relaxed whitespace-pre-wrap">
                {loading ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Translating...
                  </div>
                ) : (
                  translatedText || (
                    <span className="text-gray-400">
                      {t('translator.resultPlaceholder', 'Your translated text will appear here.')}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-5 mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Action bar */}
          <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Powered by LibreTranslate
            </p>
            <button
              onClick={handleTranslate}
              disabled={loading || !text.trim()}
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Translating...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" /> {t('translator.button', 'Translate')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// MukonoTalks

