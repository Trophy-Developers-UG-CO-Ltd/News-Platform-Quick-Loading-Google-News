/**
 * SEO Redux slice
 * Manages global structured-data schemas for admin editing and public injection
 * @module features/seo/seoSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import seoService from './seoService';

// ─── Thunks ──────────────────────────────────────────────────────────────────

/** Fetch all schemas (admin) */
export const fetchAllSchemas = createAsyncThunk(
  'seo/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await seoService.getAll();
      return data.schemas;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load schemas');
    }
  }
);

/** Fetch global schemas (public — injected site-wide) */
export const fetchGlobalSchemas = createAsyncThunk(
  'seo/fetchGlobal',
  async (_, { rejectWithValue }) => {
    try {
      const data = await seoService.getGlobal();
      return data.schemas;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load global schemas');
    }
  }
);

/** Fetch a single schema by key */
export const fetchSchemaByKey = createAsyncThunk(
  'seo/fetchByKey',
  async (key, { rejectWithValue }) => {
    try {
      const data = await seoService.getByKey(key);
      return data.schema;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Schema not found');
    }
  }
);

/** Upsert a schema (admin) */
export const upsertSchema = createAsyncThunk(
  'seo/upsert',
  async ({ key, payload }, { rejectWithValue }) => {
    try {
      const data = await seoService.upsert(key, payload);
      return data.schema;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Save failed');
    }
  }
);

/** Delete a schema (admin) */
export const deleteSchema = createAsyncThunk(
  'seo/delete',
  async (key, { rejectWithValue }) => {
    try {
      await seoService.remove(key);
      return key;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Delete failed');
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const seoSlice = createSlice({
  name: 'seo',
  initialState: {
    schemas:       [],   // admin: all schemas
    globalSchemas: [],   // public: injected site-wide
    isLoading:     false,
    isSaving:      false,
    error:         null,
  },
  reducers: {
    clearSeoError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    // fetchAll
    builder
      .addCase(fetchAllSchemas.pending,   (s) => { s.isLoading = true;  s.error = null; })
      .addCase(fetchAllSchemas.fulfilled, (s, a) => { s.isLoading = false; s.schemas = a.payload; })
      .addCase(fetchAllSchemas.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload; });

    // fetchGlobal
    builder
      .addCase(fetchGlobalSchemas.fulfilled, (s, a) => { s.globalSchemas = a.payload; });

    // upsert
    builder
      .addCase(upsertSchema.pending,   (s) => { s.isSaving = true;  s.error = null; })
      .addCase(upsertSchema.fulfilled, (s, a) => {
        s.isSaving = false;
        const idx = s.schemas.findIndex((x) => x.schemaKey === a.payload.schemaKey);
        if (idx !== -1) s.schemas[idx] = a.payload;
        else s.schemas.unshift(a.payload);
      })
      .addCase(upsertSchema.rejected,  (s, a) => { s.isSaving = false; s.error = a.payload; });

    // delete
    builder
      .addCase(deleteSchema.fulfilled, (s, a) => {
        s.schemas = s.schemas.filter((x) => x.schemaKey !== a.payload);
      });
  },
});

export const { clearSeoError } = seoSlice.actions;
export default seoSlice.reducer;

// MukonoTalks

