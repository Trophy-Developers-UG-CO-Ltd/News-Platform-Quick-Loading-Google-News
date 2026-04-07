/**
 * Google Translate Widget
 * Injects the Google Translate element for in-page content translation.
 * Lowest-effort way to translate MongoDB-rendered content on the frontend.
 * @module components/ui/GoogleTranslate
 */

import { useEffect } from 'react';

const TRANSLATE_OVERRIDES = `
  /* Hide Google branding bar that pushes body down */
  .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    overflow: hidden !important;
  }
  body { top: 0 !important; position: static !important; }
  .skiptranslate iframe { display: none !important; height: 0 !important; }

  /* Hide the "Powered by" logo link only */
  .goog-logo-link {
    display: none !important;
  }

  /* Hide the "Powered by Google Translate" text span (not the select) */
  .goog-te-gadget > span {
    display: none !important;
  }

  /* Let the gadget wrapper shrink to just the dropdown */
  .goog-te-gadget {
    color: transparent !important;
    font-size: 0 !important;
  }

  /* Keep the actual dropdown visible and styled */
  .goog-te-gadget .goog-te-combo {
    display: inline-block !important;
    visibility: visible !important;
    font-size: 13px !important;
    font-family: inherit !important;
    padding: 5px 8px !important;
    border: 1px solid #d1d5db !important;
    border-radius: 48px !important;
    background: transparent !important;
    color: #374151 !important;
    outline: none !important;
    cursor: pointer !important;
  }
  .goog-te-gadget .goog-te-combo:focus {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 2px rgba(37,99,235,0.2) !important;
  }
`;

export default function GoogleTranslate() {
  useEffect(() => {
    // Inject override styles once
    if (!document.getElementById('gt-style-overrides')) {
      const style = document.createElement('style');
      style.id = 'gt-style-overrides';
      style.textContent = TRANSLATE_OVERRIDES;
      document.head.appendChild(style);
    }

    const existingScript = document.getElementById('google-translate-script');
    if (existingScript) return;

    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,sw,zh-CN',
            autoDisplay: false,
          },
          'google_translate_element'
        );
      }
    };

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src =
      'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);

    // Google Translate injects inline top:40px on body after translation.
    // MutationObserver strips it immediately so the bar never shows.
    const observer = new MutationObserver(() => {
      if (document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.top = '0px';
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });

    return () => observer.disconnect();
  }, []);

  return <div id="google_translate_element" />;
}

// MukonoTalks

