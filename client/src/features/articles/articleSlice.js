/**
 * Article Redux slice
 * State management for enterprise publishing engine
 * @module features/articles/articleSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import articleService from './articleService';

const initialState = {
  currentArticle: null,
  articles: [],
  pagination: null,
  analytics: null,
  isLoading: false,
  error: null,
};

export const fetchPublicArticle = createAsyncThunk(
  'articles/fetchPublic',
  async ({ lang, slug }, thunkAPI) => {
    try {
      return await articleService.getPublicArticle(lang, slug);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchPublicArticles = createAsyncThunk(
  'articles/fetchPublicList',
  async (params, thunkAPI) => {
    try {
      return await articleService.listPublicArticles(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchAllArticles = createAsyncThunk(
  'articles/fetchAll',
  async (params, thunkAPI) => {
    try {
      return await articleService.getAllArticles(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchArticleAnalytics = createAsyncThunk(
  'articles/fetchAnalytics',
  async (_, thunkAPI) => {
    try {
      return await articleService.getArticleAnalytics();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const articleSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    clearArticle: (state) => {
      state.currentArticle = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch public article
      .addCase(fetchPublicArticle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPublicArticle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentArticle = action.payload.article;
      })
      .addCase(fetchPublicArticle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.currentArticle = null;
      })
      // Fetch public article list
      .addCase(fetchPublicArticles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPublicArticles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.articles = action.payload.articles;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPublicArticles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch all articles (admin)
      .addCase(fetchAllArticles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllArticles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.articles = action.payload.articles;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllArticles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch analytics
      .addCase(fetchArticleAnalytics.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchArticleAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analytics = action.payload.analytics;
      })
      .addCase(fetchArticleAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearArticle, clearError } = articleSlice.actions;
export default articleSlice.reducer;

// MukonoTalks

