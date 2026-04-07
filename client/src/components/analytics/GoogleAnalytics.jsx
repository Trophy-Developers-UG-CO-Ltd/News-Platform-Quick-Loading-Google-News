/**
 * Google Analytics 4 integration
 * Enterprise-grade tracking with consent management
 * Measurement ID sourced from admin site-settings API (env var fallback).
 * @module components/analytics/GoogleAnalytics
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ENV_GA4_ID = import.meta.env.VITE_GA4_ID || '';

// Module-level mutable — set once from DB or env
let GA_MEASUREMENT_ID = ENV_GA4_ID;

/**
 * Fetch the GA4 Measurement ID from the site-settings API.
 * Falls back to the VITE_GA4_ID env var if the request fails or returns empty.
 */
const resolveGA4Id = async () => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const res = await fetch(`${baseUrl}/site-settings`);
    if (res.ok) {
      const { settings } = await res.json();
      if (settings?.ga4MeasurementId) {
        GA_MEASUREMENT_ID = settings.ga4MeasurementId;
        return;
      }
    }
  } catch {
    // silent — fall back to env var
  }
  GA_MEASUREMENT_ID = ENV_GA4_ID;
};

/**
 * Initialize GA4 script dynamically
 * Only loads if measurement ID is configured and consent given
 */
const loadGA4Script = () => {
  if (!GA_MEASUREMENT_ID || document.getElementById('ga4-script')) return;

  // Check for cookie consent
  const consent = localStorage.getItem('cookie_consent');
  if (consent && JSON.parse(consent).analytics !== true) return;

  const script = document.createElement('script');
  script.id = 'ga4-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We handle page views manually
    cookie_flags: 'SameSite=Lax;Secure',
  });
};

/**
 * Track page view with GA4
 */
export const trackPageView = (path, title) => {
  if (!window.gtag || !GA_MEASUREMENT_ID) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });
};

/**
 * Track custom events
 * @param {string} eventName - GA4 event name
 * @param {Object} params - Event parameters
 */
export const trackEvent = (eventName, params = {}) => {
  if (!window.gtag || !GA_MEASUREMENT_ID) return;
  window.gtag('event', eventName, params);
};

// ─── Predefined Business Events ────────────────────────────────

export const trackProductView = (product) => {
  trackEvent('view_item', {
    currency: 'USD',
    value: product.price || 0,
    items: [{
      item_id: product._id,
      item_name: product.title,
      item_category: product.category?.name || '',
      price: product.price || 0,
    }],
  });
};

export const trackAddToCart = (product, quantity = 1) => {
  trackEvent('add_to_cart', {
    currency: 'USD',
    value: (product.price || 0) * quantity,
    items: [{
      item_id: product._id,
      item_name: product.title,
      quantity,
      price: product.price || 0,
    }],
  });
};

export const trackBeginCheckout = (items, total) => {
  trackEvent('begin_checkout', {
    currency: 'USD',
    value: total,
    items: items.map((item) => ({
      item_id: item.product?._id || item.productId,
      item_name: item.title,
      quantity: item.quantity,
      price: item.price || 0,
    })),
  });
};

export const trackPurchase = (order) => {
  trackEvent('purchase', {
    transaction_id: order.orderNumber,
    currency: 'USD',
    value: order.totalAmount,
    tax: order.tax,
    shipping: order.shippingCost,
    items: order.items?.map((item) => ({
      item_id: item.product,
      item_name: item.title,
      quantity: item.quantity,
      price: item.price || 0,
    })) || [],
  });
};

export const trackSearch = (searchTerm, resultsCount) => {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
  });
};

export const trackInquirySubmit = (inquiry) => {
  trackEvent('generate_lead', {
    currency: 'USD',
    value: 0,
    lead_source: 'rfq_form',
    inquiry_number: inquiry.inquiryNumber,
    items_count: inquiry.items?.length || 0,
  });
};

export const trackSignUp = (method = 'email') => {
  trackEvent('sign_up', { method });
};

export const trackLogin = (method = 'email') => {
  trackEvent('login', { method });
};

/**
 * GA4 Page View Tracker Component
 * Drop into App.jsx to automatically track route changes.
 * Resolves measurement ID from site-settings API on mount.
 */
const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    resolveGA4Id().then(() => loadGA4Script());
  }, []);

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null; // Render nothing
};

export default GoogleAnalytics;

// MukonoTalks

