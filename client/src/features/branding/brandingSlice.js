/**
 * Branding slice
 * Fetches and stores white-label branding settings from the server.
 * Settings are loaded once on app startup and cached in Redux.
 * @module features/branding/brandingSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../app/axios';

const DEFAULT_BRANDING = {
  platformName: 'MukonoTalks',
  platformTagline: 'Admin Panel',
  primaryColor: '#4f46e5',
  logoUrl: null,
  faviconUrl: null,
  supportEmail: '',
};

export const fetchBranding = createAsyncThunk(
  'branding/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/branding');
      return data.branding;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load branding');
    }
  }
);

export const saveBranding = createAsyncThunk(
  'branding/save',
  async (updates, { rejectWithValue }) => {
    try {
      const { data } = await api.put('/branding', updates);
      return data.branding;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to save branding');
    }
  }
);

const brandingSlice = createSlice({
  name: 'branding',
  initialState: {
    settings: DEFAULT_BRANDING,
    isLoading: false,
    isSaving: false,
    error: null,
    saveError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchBranding.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBranding.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = { ...DEFAULT_BRANDING, ...action.payload };
      })
      .addCase(fetchBranding.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // save
      .addCase(saveBranding.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
      })
      .addCase(saveBranding.fulfilled, (state, action) => {
        state.isSaving = false;
        state.settings = { ...DEFAULT_BRANDING, ...action.payload };
      })
      .addCase(saveBranding.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload;
      });
  },
});

export default brandingSlice.reducer;

// MukonoTalks

