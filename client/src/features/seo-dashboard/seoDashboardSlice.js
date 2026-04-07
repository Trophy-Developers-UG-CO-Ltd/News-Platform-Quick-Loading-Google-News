/**
 * SEO Dashboard Redux slice
 * Lightweight slice for UI state; data fetching is handled by TanStack Query.
 * @module features/seo-dashboard/seoDashboardSlice
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Active page being edited in MetadataManager
  activePageSlug: null,
  // Active schema type being edited in SchemaManager
  activeSchemaSlug: null,
  activeSchemaType: null,
  // Content pasted into ContentAnalyzer
  analyzerContent: '',
  analyzerTitle: '',
  analyzerDescription: '',
  analyzerFocusKeywords: [],
  // Robots.txt draft before saving
  robotsDraft: null,
  // UI filter state for MetadataManager table
  metadataFilters: {
    page: 1,
    limit: 20,
    pageType: '',
    search: '',
    sort: '-updatedAt',
  },
  // UI filter state for SchemaManager
  schemaFilters: {
    page: 1,
    limit: 20,
    schemaType: '',
    search: '',
  },
  // Notification
  notification: null,
};

const seoDashboardSlice = createSlice({
  name: 'seoDashboard',
  initialState,
  reducers: {
    setActivePageSlug(state, action) {
      state.activePageSlug = action.payload;
    },
    setActiveSchema(state, action) {
      state.activeSchemaSlug = action.payload?.slug ?? null;
      state.activeSchemaType = action.payload?.type ?? null;
    },
    setAnalyzerContent(state, action) {
      state.analyzerContent = action.payload;
    },
    setAnalyzerMeta(state, action) {
      const { title, description, focusKeywords } = action.payload;
      if (title !== undefined) state.analyzerTitle = title;
      if (description !== undefined) state.analyzerDescription = description;
      if (focusKeywords !== undefined) state.analyzerFocusKeywords = focusKeywords;
    },
    setRobotsDraft(state, action) {
      state.robotsDraft = action.payload;
    },
    clearRobotsDraft(state) {
      state.robotsDraft = null;
    },
    setMetadataFilters(state, action) {
      state.metadataFilters = { ...state.metadataFilters, ...action.payload };
    },
    resetMetadataFilters(state) {
      state.metadataFilters = initialState.metadataFilters;
    },
    setSchemaFilters(state, action) {
      state.schemaFilters = { ...state.schemaFilters, ...action.payload };
    },
    showNotification(state, action) {
      // { type: 'success'|'error'|'info', message: string }
      state.notification = action.payload;
    },
    clearNotification(state) {
      state.notification = null;
    },
  },
});

export const {
  setActivePageSlug,
  setActiveSchema,
  setAnalyzerContent,
  setAnalyzerMeta,
  setRobotsDraft,
  clearRobotsDraft,
  setMetadataFilters,
  resetMetadataFilters,
  setSchemaFilters,
  showNotification,
  clearNotification,
} = seoDashboardSlice.actions;

export default seoDashboardSlice.reducer;

// MukonoTalks

