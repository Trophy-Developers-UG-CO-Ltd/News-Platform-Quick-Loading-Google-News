/**
 * SEO Schema service
 * API calls for global structured-data schema management
 * @module features/seo/seoService
 */

import api from '../../app/axios';

const BASE = '/seo';

const seoService = {
  /** Get all schemas (admin) */
  getAll: () => api.get(BASE).then((r) => r.data),

  /** Get all active global schemas (public) */
  getGlobal: () => api.get(`${BASE}/global`).then((r) => r.data),

  /** Get schema by key (public) */
  getByKey: (key) => api.get(`${BASE}/${key}`).then((r) => r.data),

  /** Upsert schema by key (admin) */
  upsert: (key, payload) => api.put(`${BASE}/${key}`, payload).then((r) => r.data),

  /** Delete schema by key (admin) */
  remove: (key) => api.delete(`${BASE}/${key}`).then((r) => r.data),
};

export default seoService;

// MukonoTalks

