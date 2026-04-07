/**
 * SEO API service
 * All SEO-related API calls using the central axios instance.
 * @module services/seo.api
 */

import api from '../../app/axios';
import type { SeoMeta, SeoAnalysisResult, SeoMetadataStats } from '../types/seo.types';

// ─── Metadata ─────────────────────────────────────────────────

export const seoApi = {
  // Public: get metadata for rendering
  getPublic: (pageSlug: string) =>
    api.get<{ success: boolean; data: SeoMeta }>(`/seo-metadata/public/${encodeURIComponent(pageSlug)}`),

  // Admin
  getAll: (params?: { page?: number; limit?: number; pageType?: string; search?: string; sort?: string }) =>
    api.get('/seo-metadata', { params }),

  getBySlug: (pageSlug: string) =>
    api.get(`/seo-metadata/${encodeURIComponent(pageSlug)}`),

  getSerpPreview: (pageSlug: string) =>
    api.get(`/seo-metadata/${encodeURIComponent(pageSlug)}/preview`),

  upsert: (pageSlug: string, data: Partial<SeoMeta>) =>
    api.put(`/seo-metadata/${encodeURIComponent(pageSlug)}`, data),

  analyze: (pageSlug: string, content: string) =>
    api.post<{ success: boolean; data: SeoAnalysisResult }>(`/seo-metadata/${encodeURIComponent(pageSlug)}/analyze`, { content, pageSlug }),

  delete: (pageSlug: string) =>
    api.delete(`/seo-metadata/${encodeURIComponent(pageSlug)}`),

  getStats: () =>
    api.get<{ success: boolean; data: SeoMetadataStats }>('/seo-metadata/stats'),

  autoFillCanonicals: () =>
    api.post('/seo-metadata/canonicals/auto-fill'),
};

// ─── Analyzer ─────────────────────────────────────────────────

export const analyzerApi = {
  analyze: (data: { content: string; title?: string; metaDescription?: string; focusKeywords?: string[]; secondaryKeywords?: string[] }) =>
    api.post<{ success: boolean; data: SeoAnalysisResult }>('/seo-analyzer/analyze', data),
};

// ─── Schema ───────────────────────────────────────────────────

export const schemaApi = {
  getPublic: (pageSlug: string) =>
    api.get(`/seo-schema/public/${encodeURIComponent(pageSlug)}`),

  getAll: (params?: { page?: number; limit?: number; schemaType?: string; search?: string }) =>
    api.get('/seo-schema', { params }),

  getBySlug: (pageSlug: string) =>
    api.get(`/seo-schema/${encodeURIComponent(pageSlug)}`),

  upsert: (pageSlug: string, schemaType: string, schemaJSON: Record<string, unknown>) =>
    api.put(`/seo-schema/${encodeURIComponent(pageSlug)}/${schemaType}`, { schemaJSON }),

  delete: (pageSlug: string, schemaType?: string) =>
    api.delete(`/seo-schema/${encodeURIComponent(pageSlug)}`, { params: { schemaType } }),
};

// ─── Redirects ────────────────────────────────────────────────

export const redirectApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/redirects', { params }),

  create: (data: { fromPath: string; toPath: string; statusCode?: 301 | 302; note?: string }) =>
    api.post('/redirects', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/redirects/${id}`, data),

  approve: (id: string) =>
    api.patch(`/redirects/${id}/approve`),

  reject: (id: string) =>
    api.patch(`/redirects/${id}/reject`),

  delete: (id: string) =>
    api.delete(`/redirects/${id}`),

  getStats: () =>
    api.get('/redirects/stats'),
};

// ─── Internal Links ───────────────────────────────────────────

export const linksApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/seo-links', { params }),

  create: (data: Record<string, unknown>) =>
    api.post('/seo-links', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/seo-links/${id}`, data),

  delete: (id: string) =>
    api.delete(`/seo-links/${id}`),

  suggest: (content: string, pageSlug?: string) =>
    api.post('/seo-links/suggest', { content, pageSlug }),

  getOrphaned: (slugs: string[]) =>
    api.post('/seo-links/orphaned', { slugs }),
};

// ─── Technical SEO ────────────────────────────────────────────

export const technicalApi = {
  getRobots: () =>
    api.get('/technical-seo/robots'),

  saveRobots: (content: string) =>
    api.put('/technical-seo/robots', { content }),

  getDefaultRobots: () =>
    api.get('/technical-seo/robots/default'),

  runAudit: () =>
    api.get('/technical-seo/audit'),

  getCanonicalAudit: () =>
    api.get('/technical-seo/audit/canonical'),

  getDuplicates: () =>
    api.get('/technical-seo/audit/duplicates'),

  getOrphans: () =>
    api.get('/technical-seo/audit/orphans'),

  getUrlCleanup: () =>
    api.get('/technical-seo/audit/url-cleanup'),
};

// ─── Indexing ─────────────────────────────────────────────────

export const indexingApi = {
  submitIndexNow: (urls: string[]) =>
    api.post('/seo-indexing/indexnow', { urls }),

  submitGoogle: (urls: string[], type?: string) =>
    api.post('/seo-indexing/google', { urls, type }),

  submitAll: () =>
    api.post('/seo-indexing/submit-all'),
};

// ─── Analytics ────────────────────────────────────────────────

export const seoAnalyticsApi = {
  getDashboard: () =>
    api.get('/seo-analytics/dashboard'),

  getTopPages: (limit?: number) =>
    api.get('/seo-analytics/top-pages', { params: { limit } }),

  getNeedsAttention: () =>
    api.get('/seo-analytics/needs-attention'),

  getScoreHistory: (pageSlug: string) =>
    api.get(`/seo-analytics/score-history/${encodeURIComponent(pageSlug)}`),
};

// ─── SEO Rules ────────────────────────────────────────────────

export const seoRulesApi = {
  getAll: (pageType?: string) =>
    api.get('/seo-rules', { params: { pageType } }),

  create: (data: Record<string, unknown>) =>
    api.post('/seo-rules', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/seo-rules/${id}`, data),

  delete: (id: string) =>
    api.delete(`/seo-rules/${id}`),

  seedDefaults: () =>
    api.post('/seo-rules/seed'),
};

// MukonoTalks

