/**
 * Navigation slice
 * Fetches and stores admin-configurable nav menu items
 * @module features/nav/navSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../app/axios';

/* ─── Thunks ──────────────────────────────────────────────────── */

export const fetchNavItems = createAsyncThunk(
  'nav/fetchNavItems',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/navigation');
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load navigation');
    }
  }
);

export const saveNavItems = createAsyncThunk(
  'nav/saveNavItems',
  async (items, { rejectWithValue }) => {
    try {
      const { data } = await api.put('/navigation', { items });
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to save navigation');
    }
  }
);

export const fetchAdminNavItems = createAsyncThunk(
  'nav/fetchAdminNavItems',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/navigation/admin');
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load navigation');
    }
  }
);

export const deleteNavItem = createAsyncThunk(
  'nav/deleteNavItem',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/navigation/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete item');
    }
  }
);

/* ─── Slice ───────────────────────────────────────────────────── */

const navSlice = createSlice({
  name: 'nav',
  initialState: {
    items: [],
    isLoading: false,
    isSaving: false,
    error: null,
  },
  reducers: {
    setItems(state, action) {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNavItems
      .addCase(fetchNavItems.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchNavItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchNavItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // fetchAdminNavItems
      .addCase(fetchAdminNavItems.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchAdminNavItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchAdminNavItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // saveNavItems
      .addCase(saveNavItems.pending, (state) => { state.isSaving = true; })
      .addCase(saveNavItems.fulfilled, (state, action) => {
        state.isSaving = false;
        state.items = action.payload;
      })
      .addCase(saveNavItems.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      })

      // deleteNavItem
      .addCase(deleteNavItem.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i._id !== action.payload);
      });
  },
});

export const { setItems } = navSlice.actions;
export default navSlice.reducer;

// MukonoTalks

