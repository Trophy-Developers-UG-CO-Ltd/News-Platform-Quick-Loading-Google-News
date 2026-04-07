/**
 * Axios instance — centralized API configuration
 * All API calls go through this instance
 * Uses HTTP-only cookies exclusively for auth
 * @module app/axios
 */

import axios from 'axios';
import i18n from '../i18n';

const rawApiUrl = import.meta.env.VITE_API_URL?.trim();

/**
 * Normalize API base URL:
 * - In development, default to '/api' so Vite proxy handles requests
 * - In production, also prefer '/api' unless explicitly overridden
 * - If user provides full URL, append /api if missing
 */
const normalizeApiUrl = (url) => {
  if (!url) return '/api';

  const cleaned = url.replace(/\/+$/, '');

  // If already relative
  if (cleaned.startsWith('/')) {
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  }

  // Absolute URL
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
};

const API_URL = normalizeApiUrl(rawApiUrl);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    config.headers['Accept-Language'] = i18n.language || 'en';

    let sessionId = sessionStorage.getItem('mukonoTalksSessionId');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem('mukonoTalksSessionId', sessionId);
    }

    config.headers['X-Session-ID'] = sessionId;

    // Add JWT token from localStorage to Authorization header if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;