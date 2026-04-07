/**
 * Footer slice
 * Fetches and stores admin-configurable footer settings
 * @module features/footer/footerSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../app/axios';

const DEFAULT = {
  tagline: 'MukonoTalks publishes local news, entertainment, community updates, and video stories for Mukono audiences.',
  quickLinks: [
    { label: 'Home',               href: '/' },
    { label: 'News',               href: '/news' },
    { label: 'Local Updates',      href: '/local' },
    { label: 'Entertainment',      href: '/entertainment' },
    { label: 'Videos',             href: '/videos' },
    { label: 'Privacy Policy',     href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
  ],
  serviceLinks: [
    { label: 'Editorial CMS', href: '/editor' },
    { label: 'Contact Us',    href: '/contact' },
  ],
  contactEmail:   'info@mukonotalks.ug',
  contactPhone:   '+256 (0) 700 000 000',
  contactAddress: 'Mukono, Uganda',
  copyrightName:  'MukonoTalks',
};

export const fetchFooter = createAsyncThunk(
  'footer/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/footer');
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load footer');
    }
  }
);

export const saveFooter = createAsyncThunk(
  'footer/save',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.put('/footer', payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to save footer');
    }
  }
);

const footerSlice = createSlice({
  name: 'footer',
  initialState: {
    settings: DEFAULT,
    isLoading: false,
    isSaving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFooter.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchFooter.fulfilled, (state, action) => { state.isLoading = false; state.settings = action.payload; })
      .addCase(fetchFooter.rejected,  (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(saveFooter.pending,    (state) => { state.isSaving = true; })
      .addCase(saveFooter.fulfilled,  (state, action) => { state.isSaving = false; state.settings = action.payload; })
      .addCase(saveFooter.rejected,   (state, action) => { state.isSaving = false; state.error = action.payload; });
  },
});

export default footerSlice.reducer;

// MukonoTalks

