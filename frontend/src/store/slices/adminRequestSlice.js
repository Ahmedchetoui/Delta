import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Actions asynchrones
export const createAdminRequest = createAsyncThunk(
  'adminRequests/createAdminRequest',
  async (requestData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/admin-requests`, requestData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors de la création de la demande'
      );
    }
  }
);

export const fetchAdminRequests = createAsyncThunk(
  'adminRequests/fetchAdminRequests',
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const response = await axios.get(`${API_URL}/admin-requests?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors du chargement des demandes'
      );
    }
  }
);

export const fetchUserAdminRequestStatus = createAsyncThunk(
  'adminRequests/fetchUserAdminRequestStatus',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin-requests/user/status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors de la vérification du statut'
      );
    }
  }
);

export const approveAdminRequest = createAsyncThunk(
  'adminRequests/approveAdminRequest',
  async ({ requestId, reviewNotes }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/admin-requests/${requestId}/approve`, 
        { reviewNotes }, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors de l\'approbation de la demande'
      );
    }
  }
);

export const rejectAdminRequest = createAsyncThunk(
  'adminRequests/rejectAdminRequest',
  async ({ requestId, reviewNotes }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/admin-requests/${requestId}/reject`, 
        { reviewNotes }, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors du rejet de la demande'
      );
    }
  }
);

const initialState = {
  requests: [],
  userRequest: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalRequests: 0,
    hasNext: false,
    hasPrev: false,
  },
  isLoading: false,
  isCreating: false,
  error: null,
};

const adminRequestSlice = createSlice({
  name: 'adminRequests',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Admin Request
      .addCase(createAdminRequest.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createAdminRequest.fulfilled, (state, action) => {
        state.isCreating = false;
        state.userRequest = action.payload.data;
        state.error = null;
      })
      .addCase(createAdminRequest.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })
      
      // Fetch Admin Requests
      .addCase(fetchAdminRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.requests = action.payload.data.requests;
        state.pagination = action.payload.data.pagination;
        state.error = null;
      })
      .addCase(fetchAdminRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch User Admin Request Status
      .addCase(fetchUserAdminRequestStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserAdminRequestStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userRequest = action.payload.data.request;
        state.error = null;
      })
      .addCase(fetchUserAdminRequestStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Approve Admin Request
      .addCase(approveAdminRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(approveAdminRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.requests.findIndex(req => req._id === action.payload.data._id);
        if (index !== -1) {
          state.requests[index] = action.payload.data;
        }
        state.error = null;
      })
      .addCase(approveAdminRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Reject Admin Request
      .addCase(rejectAdminRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rejectAdminRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.requests.findIndex(req => req._id === action.payload.data._id);
        if (index !== -1) {
          state.requests[index] = action.payload.data;
        }
        state.error = null;
      })
      .addCase(rejectAdminRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setLoading } = adminRequestSlice.actions;
export default adminRequestSlice.reducer;
