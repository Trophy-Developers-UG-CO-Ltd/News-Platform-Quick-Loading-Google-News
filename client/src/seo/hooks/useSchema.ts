/**
 * TanStack Query hooks for the Schema Engine.
 * @module hooks/useSchema
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schemaApi } from '../services/seo.api';
import type { SchemaType } from '../types/schema.types';

// ─── Query Keys ──────────────────────────────────────────────

export const SCHEMA_KEYS = {
  all: ['schema'] as const,
  lists: () => [...SCHEMA_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...SCHEMA_KEYS.lists(), params] as const,
  bySlug: (slug: string) => [...SCHEMA_KEYS.all, 'slug', slug] as const,
  public: (slug: string) => [...SCHEMA_KEYS.all, 'public', slug] as const,
};

// ─── Public hooks ─────────────────────────────────────────────

/** Get injectable JSON-LD schemas for a page slug (used on public routes). */
export function usePublicSchema(pageSlug: string | undefined) {
  return useQuery({
    queryKey: SCHEMA_KEYS.public(pageSlug ?? ''),
    queryFn: () => schemaApi.getPublic(pageSlug!).then((r) => r.data.data as string[]),
    enabled: !!pageSlug,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Admin List ───────────────────────────────────────────────

export function useSchemaList(params: { page?: number; limit?: number; schemaType?: string; search?: string } = {}) {
  return useQuery({
    queryKey: SCHEMA_KEYS.list(params),
    queryFn: () => schemaApi.getAll(params).then((r) => r.data),
    staleTime: 1000 * 30,
  });
}

// ─── By Slug ──────────────────────────────────────────────────

export function useSchemasBySlug(pageSlug: string | undefined) {
  return useQuery({
    queryKey: SCHEMA_KEYS.bySlug(pageSlug ?? ''),
    queryFn: () => schemaApi.getBySlug(pageSlug!).then((r) => r.data.data),
    enabled: !!pageSlug,
  });
}

// ─── Mutations ────────────────────────────────────────────────

export function useUpsertSchema() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pageSlug, schemaType, schemaJSON }: { pageSlug: string; schemaType: SchemaType; schemaJSON: Record<string, unknown> }) =>
      schemaApi.upsert(pageSlug, schemaType, schemaJSON).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: SCHEMA_KEYS.bySlug(variables.pageSlug) });
      qc.invalidateQueries({ queryKey: SCHEMA_KEYS.lists() });
    },
  });
}

export function useDeleteSchema() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pageSlug, schemaType }: { pageSlug: string; schemaType?: SchemaType }) =>
      schemaApi.delete(pageSlug, schemaType).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SCHEMA_KEYS.all });
    },
  });
}

// MukonoTalks

