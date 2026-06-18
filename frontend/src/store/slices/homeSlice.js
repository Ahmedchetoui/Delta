import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { getApiBaseUrl } from '../../config/apiConfig';

const API_URL = getApiBaseUrl();
const HOME_STALE_MS = 5 * 60 * 1000;

export const fetchHomeData = createAsyncThunk(
  'home/fetchHomeData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/home`, { timeout: 30000 });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors du chargement de la page d\'accueil'
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const { home } = getState();
      if (home.isLoading) return false;
      if (home.loadedAt && Date.now() - home.loadedAt < HOME_STALE_MS) {
        return false;
      }
      return true;
    },
  }
);

const initialState = {
  banners: [],
  isLoading: false,
  loadedAt: null,
  error: null,
};

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    clearHomeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeData.pending, (state) => {
        if (!state.loadedAt) {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchHomeData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.banners = action.payload.banners || [];
        state.loadedAt = Date.now();
        state.error = null;
      })
      .addCase(fetchHomeData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearHomeError } = homeSlice.actions;
export default homeSlice.reducer;
