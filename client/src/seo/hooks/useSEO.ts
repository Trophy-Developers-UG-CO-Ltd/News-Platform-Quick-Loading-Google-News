/**
 * TanStack Query hooks for SEO metadata, analyzer, analytics.
 * @module hooks/useSEO
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seoApi, analyzerApi, seoAnalyticsApi } from '../services/seo.api';
import type { SeoMeta } from '../types/seo.types';

// ─── Query Keys ──────────────────────────────────────────────

export const SEO_KEYS = {
  all: ['seo'] as const,
  lists: () => [...SEO_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...SEO_KEYS.lists(), params] as const,
  detail: (slug: string) => [...SEO_KEYS.all, 'detail', slug] as const,
  preview: (slug: string) => [...SEO_KEYS.all, 'preview', slug] as const,
  stats: () => [...SEO_KEYS.all, 'stats'] as const,
  analytics: () => [...SEO_KEYS.all, 'analytics'] as const,
  topPages: (limit?: number) => [...SEO_KEYS.all, 'topPages', limit] as const,
  needsAttention: () => [...SEO_KEYS.all, 'needsAttention'] as const,
  scoreHistory: (slug: string) => [...SEO_KEYS.all, 'scoreHistory', slug] as const,
};

// ─── Public Hooks (for page rendering) ───────────────────────

/** Fetch SEO metadata for a given page slug (used on public-facing pages). */
export function useSeoMeta(pageSlug: string | undefined) {
  return useQuery({
    queryKey: SEO_KEYS.detail(pageSlug ?? ''),
    queryFn: () => seoApi.getPublic(pageSlug!).then((r) => r.data.data),
    enabled: !!pageSlug,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ─── Admin List Hook ──────────────────────────────────────────

export function useSeoList(params: { page?: number; limit?: number; pageType?: string; search?: string; sort?: string } = {}) {
  return useQuery({
    queryKey: SEO_KEYS.list(params),
    queryFn: () => seoApi.getAll(params).then((r) => r.data),
    staleTime: 1000 * 30,
  });
}

// ─── Admin Detail / Preview ───────────────────────────────────

export function useSeoDetail(pageSlug: string | undefined) {
  return useQuery({
    queryKey: SEO_KEYS.detail(pageSlug ?? ''),
    queryFn: () => seoApi.getBySlug(pageSlug!).then((r) => r.data.data),
    enabled: !!pageSlug,
  });
}

export function useSerpPreview(pageSlug: string | undefined) {
  return useQuery({
    queryKey: SEO_KEYS.preview(pageSlug ?? ''),
    queryFn: () => seoApi.getSerpPreview(pageSlug!).then((r) => r.data.data),
    enabled: !!pageSlug,
    staleTime: 1000 * 60,
  });
}

// ─── Stats ───────────────────────────────────────────────────

export function useSeoStats() {
  return useQuery({
    queryKey: SEO_KEYS.stats(),
    queryFn: () => seoApi.getStats().then((r) => r.data.data),
    staleTime: 1000 * 60,
  });
}

// ─── Analytics ───────────────────────────────────────────────

export function useSeoAnalyticsDashboard() {
  return useQuery({
    queryKey: SEO_KEYS.analytics(),
    queryFn: () => seoAnalyticsApi.getDashboard().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });
}

export function useTopPages(limit = 10) {
  return useQuery({
    queryKey: SEO_KEYS.topPages(limit),
    queryFn: () => seoAnalyticsApi.getTopPages(limit).then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });
}

export function usePagesNeedingAttention() {
  return useQuery({
    queryKey: SEO_KEYS.needsAttention(),
    queryFn: () => seoAnalyticsApi.getNeedsAttention().then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });
}

export function useScoreHistory(pageSlug: string | undefined) {
  return useQuery({
    queryKey: SEO_KEYS.scoreHistory(pageSlug ?? ''),
    queryFn: () => seoAnalyticsApi.getScoreHistory(pageSlug!).then((r) => r.data.data),
    enabled: !!pageSlug,
  });
}

// ─── Mutations ───────────────────────────────────────────────

export function useUpsertSeo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pageSlug, data }: { pageSlug: string; data: Partial<SeoMeta> }) =>
      seoApi.upsert(pageSlug, data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: SEO_KEYS.detail(variables.pageSlug) });
      qc.invalidateQueries({ queryKey: SEO_KEYS.lists() });
      qc.invalidateQueries({ queryKey: SEO_KEYS.stats() });
    },
  });
}

export function useDeleteSeo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pageSlug: string) => seoApi.delete(pageSlug).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SEO_KEYS.lists() });
      qc.invalidateQueries({ queryKey: SEO_KEYS.stats() });
    },
  });
}

export function useAnalyzeContent() {
  return useMutation({
    mutationFn: (data: { content: string; title?: string; metaDescription?: string; focusKeywords?: string[]; secondaryKeywords?: string[] }) =>
      analyzerApi.analyze(data).then((r) => r.data.data),
  });
}

export function useAutoFillCanonicals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => seoApi.autoFillCanonicals().then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SEO_KEYS.lists() });
    },
  });
}

// MukonoTalks

