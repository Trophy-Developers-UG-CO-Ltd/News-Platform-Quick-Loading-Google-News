/**
 * Redirect service — client
 * Axios calls to the /api/redirects module
 * @module features/redirects/redirectService
 */

import api from '../../app/axios';

const redirectService = {
  getAll: (params = {}) => api.get('/redirects', { params }).then((r) => r.data),

  getStats: () => api.get('/redirects/stats').then((r) => r.data),

  create: (data) => api.post('/redirects', data).then((r) => r.data),

  update: (id, data) => api.put(`/redirects/${id}`, data).then((r) => r.data),

  approve: (id) => api.patch(`/redirects/${id}/approve`).then((r) => r.data),

  reject: (id) => api.patch(`/redirects/${id}/reject`).then((r) => r.data),

  remove: (id) => api.delete(`/redirects/${id}`).then((r) => r.data),

  /** Resolve a fromPath to its approved redirect (used by NotFound page) */
  resolve: (fromPath) =>
    api.get('/redirects/resolve', { params: { from: fromPath } }).then((r) => r.data),

  /** Fire-and-forget click tracker */
  trackClick: (fromPath) =>
    api.post('/redirects/track', { fromPath }).catch(() => null),
};

export default redirectService;

// MukonoTalks

