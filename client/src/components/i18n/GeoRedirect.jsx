/**
 * GeoRedirect Component
 * Handles automatic language redirection based on user's geographic location
 * 
 * Behavior:
 * 1. First-time visitors: Detect country via IP → redirect to appropriate language
 * 2. Returning visitors: Use saved language preference
 * 3. Fallback: Default to English (/en)
 * 
 * @module components/i18n/GeoRedirect
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  detectUserGeo,
  isFirstVisit,
  markGeoDetected,
  getSavedLanguage,
  saveLanguagePreference,
} from '../../utils/geoTargeting';
import { DEFAULT_LANGUAGE } from '../../i18n';
import Spinner from '../ui/Spinner';

const GeoRedirect = () => {
  const [targetLanguage, setTargetLanguage] = useState(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const determineLanguage = async () => {
      // Check for saved language preference first
      const savedLang = getSavedLanguage();
      if (savedLang) {
        setTargetLanguage(savedLang);
        setIsDetecting(false);
        return;
      }

      // For first-time visitors, detect geo
      if (isFirstVisit()) {
        try {
          const geo = await detectUserGeo();
          console.log('[GeoRedirect] Detected:', geo);
          markGeoDetected();
          // Persist the detected language in both cookie and localStorage
          saveLanguagePreference(geo.language);
          setTargetLanguage(geo.language);
        } catch (error) {
          console.warn('[GeoRedirect] Detection failed:', error);
          setTargetLanguage(DEFAULT_LANGUAGE);
        }
      } else {
        // Not first visit but no saved lang (edge case) — use default
        setTargetLanguage(DEFAULT_LANGUAGE);
      }

      setIsDetecting(false);
    };

    determineLanguage();
  }, []);

  // Show loading spinner while detecting
  if (isDetecting) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500 text-sm">Detecting your location...</p>
        </div>
      </div>
    );
  }

  // Preserve any search params from original URL
  const searchParams = location.search || '';
  
  // Redirect to determined language
  return <Navigate to={`/${targetLanguage}${searchParams}`} replace />;
};

export default GeoRedirect;

// MukonoTalks

