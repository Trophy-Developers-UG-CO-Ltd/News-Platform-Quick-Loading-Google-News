/**
 * Cookie Consent Banner
 * POPIA-compliant cookie consent management
 * Integrates with Google Analytics consent checking
 * @module components/ui/CookieConsent
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX, FiSettings, FiCheck } from 'react-icons/fi';
import LocalizedLink from '../i18n/LocalizedLink';

const CONSENT_KEY = 'cookie_consent';

/**
 * Get current consent settings from localStorage
 */
const getStoredConsent = () => {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Save consent settings to localStorage
 */
const saveConsent = (consent) => {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    // Dispatch event so GA4 can react to consent changes
    window.dispatchEvent(new CustomEvent('cookie_consent_updated', { detail: consent }));
  } catch {
    // Silent fail
  }
};

const CookieConsent = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState({
    essential: true, // Always required
    analytics: false,
    preferences: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const stored = getStoredConsent();
    if (!stored) {
      // No consent stored - show banner after short delay
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
    // User has already consented - don't show banner
    setConsent(stored);
    setVisible(false);
  }, []);

  const handleAcceptAll = () => {
    const fullConsent = {
      essential: true,
      analytics: true,
      preferences: true,
      timestamp: new Date().toISOString(),
    };
    saveConsent(fullConsent);
    setConsent(fullConsent);
    setVisible(false);
    // Reload page to initialize analytics
    if (!getStoredConsent()?.analytics) {
      window.location.reload();
    }
  };

  const handleRejectNonEssential = () => {
    const minimalConsent = {
      essential: true,
      analytics: false,
      preferences: false,
      timestamp: new Date().toISOString(),
    };
    saveConsent(minimalConsent);
    setConsent(minimalConsent);
    setVisible(false);
  };

  const handleSavePreferences = () => {
    const userConsent = {
      ...consent,
      essential: true, // Always required
      timestamp: new Date().toISOString(),
    };
    saveConsent(userConsent);
    setVisible(false);
    // Reload if analytics consent changed
    if (consent.analytics && !getStoredConsent()?.analytics) {
      window.location.reload();
    }
  };

  const toggleConsent = (type) => {
    if (type === 'essential') return; // Can't toggle essential
    setConsent((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-2xl border border-gray-200">
        {/* Main Banner */}
        {!showSettings ? (
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('cookies.title', 'We value your privacy')}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {t('cookies.description', 'We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. By clicking "Accept All", you consent to our use of cookies.')}
                  {' '}
                  <LocalizedLink to="/privacy" className="text-primary-600 hover:underline">
                    {t('cookies.learnMore', 'Learn more')}
                  </LocalizedLink>
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleAcceptAll}
                    className="px-5 py-2 bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2"
                  >
                    <FiCheck className="h-4 w-4" />
                    <span>{t('cookies.acceptAll', 'Accept All')}</span>
                  </button>
                  <button
                    onClick={handleRejectNonEssential}
                    className="px-5 py-2 bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    {t('cookies.rejectNonEssential', 'Essential Only')}
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <FiSettings className="h-4 w-4" />
                    <span>{t('cookies.customize', 'Customize')}</span>
                  </button>
                </div>
              </div>
              <button
                onClick={handleRejectNonEssential}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          /* Settings Panel */
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('cookies.settingsTitle', 'Cookie Preferences')}
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Essential Cookies */}
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {t('cookies.essential.title', 'Essential Cookies')}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('cookies.essential.description', 'Required for basic website functionality including authentication and security. Cannot be disabled.')}
                  </p>
                </div>
                <div className="ml-4">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                    {t('cookies.alwaysOn', 'Always On')}
                  </span>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {t('cookies.analytics.title', 'Analytics Cookies')}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('cookies.analytics.description', 'Help us understand how visitors interact with our website using Google Analytics. Data is anonymized.')}
                  </p>
                </div>
                <button
                  onClick={() => toggleConsent('analytics')}
                  className={`ml-4 relative w-12 h-6 rounded-none transition-colors ${
                    consent.analytics ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      consent.analytics ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Preference Cookies */}
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {t('cookies.preferences.title', 'Preference Cookies')}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('cookies.preferences.description', 'Remember your language selection and other site preferences for a better experience.')}
                  </p>
                </div>
                <button
                  onClick={() => toggleConsent('preferences')}
                  className={`ml-4 relative w-12 h-6 rounded-none transition-colors ${
                    consent.preferences ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      consent.preferences ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-800 transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-5 py-2 bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                {t('cookies.savePreferences', 'Save Preferences')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsent;

// MukonoTalks

