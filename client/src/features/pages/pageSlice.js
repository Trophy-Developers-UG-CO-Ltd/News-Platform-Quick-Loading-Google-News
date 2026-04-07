/**
 * Page Redux slice
 * State management for CMS pages
 * @module features/pages/pageSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import pageService from './pageService';

const initialState = {
  currentPage: null,
  pages: [],
  pagination: null,
  isLoading: false,
  error: null,
};

export const fetchPublicPage = createAsyncThunk(
  'pages/fetchPublic',
  async ({ lang, slug }, thunkAPI) => {
    try {
      return await pageService.getPublicPage(lang, slug);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchAllPages = createAsyncThunk(
  'pages/fetchAll',
  async (params, thunkAPI) => {
    try {
      return await pageService.getAllPages(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const pageSlice = createSlice({
  name: 'pages',
  initialState,
  reducers: {
    clearPage: (state) => {
      state.currentPage = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch public page
      .addCase(fetchPublicPage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPublicPage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPage = action.payload.page;
      })
      .addCase(fetchPublicPage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.currentPage = null;
      })
      // Fetch all pages (admin)
      .addCase(fetchAllPages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllPages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pages = action.payload.pages;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllPages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPage, clearError } = pageSlice.actions;
export default pageSlice.reducer;

// MukonoTalks

