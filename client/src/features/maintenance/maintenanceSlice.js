/**
 * Maintenance slice
 * Fetches and stores maintenance mode status from the server.
 * Checked on app startup; developer can toggle via admin panel.
 * @module features/maintenance/maintenanceSlice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../app/axios';

export const fetchMaintenanceStatus = createAsyncThunk(
  'maintenance/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/maintenance');
      return data.maintenance;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to check maintenance status');
    }
  }
);

export const toggleMaintenance = createAsyncThunk(
  'maintenance/toggle',
  async (updates, { rejectWithValue }) => {
    try {
      const { data } = await api.put('/maintenance', updates);
      return data.maintenance;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update maintenance mode');
    }
  }
);

const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState: {
    isEnabled: false,
    message: '',
    estimatedEnd: null,
    isLoading: false,
    isSaving: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaintenanceStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMaintenanceStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isEnabled = action.payload.isEnabled;
        state.message = action.payload.message;
        state.estimatedEnd = action.payload.estimatedEnd;
      })
      .addCase(fetchMaintenanceStatus.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(toggleMaintenance.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(toggleMaintenance.fulfilled, (state, action) => {
        state.isSaving = false;
        state.isEnabled = action.payload.isEnabled;
        state.message = action.payload.message;
        state.estimatedEnd = action.payload.estimatedEnd;
      })
      .addCase(toggleMaintenance.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      });
  },
});

export default maintenanceSlice.reducer;

// MukonoTalks

