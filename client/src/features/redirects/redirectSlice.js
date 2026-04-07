/**
 * Redirect Redux slice
 * State management for the admin redirect manager
 * @module features/redirects/redirectSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import redirectService from './redirectService';

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchAllRedirects = createAsyncThunk(
  'redirects/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      return await redirectService.getAll(params);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load redirects');
    }
  }
);

export const fetchRedirectStats = createAsyncThunk(
  'redirects/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      return await redirectService.getStats();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load stats');
    }
  }
);

export const createRedirect = createAsyncThunk(
  'redirects/create',
  async (data, { rejectWithValue }) => {
    try {
      return await redirectService.create(data);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create redirect');
    }
  }
);

export const updateRedirect = createAsyncThunk(
  'redirects/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await redirectService.update(id, data);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update redirect');
    }
  }
);

export const approveRedirect = createAsyncThunk(
  'redirects/approve',
  async (id, { rejectWithValue }) => {
    try {
      return await redirectService.approve(id);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to approve');
    }
  }
);

export const rejectRedirect = createAsyncThunk(
  'redirects/reject',
  async (id, { rejectWithValue }) => {
    try {
      return await redirectService.reject(id);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to reject');
    }
  }
);

export const deleteRedirect = createAsyncThunk(
  'redirects/delete',
  async (id, { rejectWithValue }) => {
    try {
      await redirectService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete');
    }
  }
);

// ── Helpers ───────────────────────────────────────────────────────────────────

const upsertRedirect = (state, updated) => {
  const idx = state.redirects.findIndex((r) => r._id === updated._id);
  if (idx !== -1) state.redirects[idx] = updated;
  else state.redirects.unshift(updated);
};

// ── Slice ─────────────────────────────────────────────────────────────────────

const redirectSlice = createSlice({
  name: 'redirects',
  initialState: {
    redirects: [],
    total: 0,
    pages: 1,
    stats: { total: 0, pending: 0, approved: 0, rejected: 0, totalClicks: 0 },
    isLoading: false,
    isSaving: false,
    error: null,
  },
  reducers: {
    clearRedirectError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchAllRedirects.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchAllRedirects.fulfilled, (s, a) => {
        s.isLoading = false;
        s.redirects = a.payload.redirects;
        s.total = a.payload.total;
        s.pages = a.payload.pages;
      })
      .addCase(fetchAllRedirects.rejected, (s, a) => { s.isLoading = false; s.error = a.payload; })

      // fetchStats
      .addCase(fetchRedirectStats.fulfilled, (s, a) => { s.stats = a.payload.stats; })

      // create
      .addCase(createRedirect.pending, (s) => { s.isSaving = true; })
      .addCase(createRedirect.fulfilled, (s, a) => {
        s.isSaving = false;
        if (a.payload.redirect) s.redirects.unshift(a.payload.redirect);
      })
      .addCase(createRedirect.rejected, (s, a) => { s.isSaving = false; s.error = a.payload; })

      // update
      .addCase(updateRedirect.pending, (s) => { s.isSaving = true; })
      .addCase(updateRedirect.fulfilled, (s, a) => {
        s.isSaving = false;
        if (a.payload.redirect) upsertRedirect(s, a.payload.redirect);
      })
      .addCase(updateRedirect.rejected, (s, a) => { s.isSaving = false; s.error = a.payload; })

      // approve
      .addCase(approveRedirect.fulfilled, (s, a) => {
        if (a.payload.redirect) upsertRedirect(s, a.payload.redirect);
      })
      .addCase(approveRedirect.rejected, (s, a) => { s.error = a.payload; })

      // reject
      .addCase(rejectRedirect.fulfilled, (s, a) => {
        if (a.payload.redirect) upsertRedirect(s, a.payload.redirect);
      })
      .addCase(rejectRedirect.rejected, (s, a) => { s.error = a.payload; })

      // delete
      .addCase(deleteRedirect.fulfilled, (s, a) => {
        s.redirects = s.redirects.filter((r) => r._id !== a.payload);
      })
      .addCase(deleteRedirect.rejected, (s, a) => { s.error = a.payload; });
  },
});

export const { clearRedirectError } = redirectSlice.actions;
export default redirectSlice.reducer;

// MukonoTalks

