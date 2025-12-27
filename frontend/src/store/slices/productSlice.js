import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Actions asynchrones
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();

      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const response = await axios.get(`${API_URL}/products?${queryParams}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors du chargement des produits'
      );
    }
  }
);

export const fetchProduct = createAsyncThunk(
  'products/fetchProduct',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/products/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors du chargement du produit'
      );
    }
  }
);

export const fetchProductBySlug = createAsyncThunk(
  'products/fetchProductBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/products/slug/${slug}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors du chargement du produit'
      );
    }
  }
);

export const fetchFeaturedProducts = createAsyncThunk(
  'products/fetchFeaturedProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/products/featured`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors du chargement des produits en vedette'
      );
    }
  }
);

export const fetchNewProducts = createAsyncThunk(
  'products/fetchNewProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/products/new`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors du chargement des nouveaux produits'
      );
    }
  }
);

export const fetchSaleProducts = createAsyncThunk(
  'products/fetchSaleProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/products/sale`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors du chargement des produits en promotion'
      );
    }
  }
);

export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (searchParams, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();

      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] !== undefined && searchParams[key] !== null && searchParams[key] !== '') {
          queryParams.append(key, searchParams[key]);
        }
      });

      const response = await axios.get(`${API_URL}/products?${queryParams}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors de la recherche'
      );
    }
  }
);

export const addProductReview = createAsyncThunk(
  'products/addProductReview',
  async ({ productId, reviewData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/products/${productId}/reviews`,
        reviewData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors de l\'ajout de l\'avis'
      );
    }
  }
);

const initialState = {
  products: [],
  currentProduct: null,
  featuredProducts: [],
  newProducts: [],
  saleProducts: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNext: false,
    hasPrev: false,
  },
  filters: {
    category: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    sort: 'newest',
    featured: false,
    onSale: false,
    inStock: false,
  },
  isLoading: false,
  isSearching: false,
  error: null,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        category: '',
        minPrice: '',
        maxPrice: '',
        search: '',
        sort: 'newest',
        featured: false,
        onSale: false,
        inStock: false,
      };
    },
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch Product
      .addCase(fetchProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload.product;
        state.error = null;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch Product By Slug
      .addCase(fetchProductBySlug.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload.product;
        state.error = null;
      })
      .addCase(fetchProductBySlug.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch Featured Products
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.featuredProducts = action.payload.products;
        state.error = null;
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch New Products
      .addCase(fetchNewProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNewProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.newProducts = action.payload.products;
        state.error = null;
      })
      .addCase(fetchNewProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch Sale Products
      .addCase(fetchSaleProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSaleProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.saleProducts = action.payload.products;
        state.error = null;
      })
      .addCase(fetchSaleProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Search Products
      .addCase(searchProducts.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.isSearching = false;
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload;
      })

      // Add Product Review
      .addCase(addProductReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addProductReview.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentProduct) {
          state.currentProduct.reviews.push(action.payload.review);
        }
        state.error = null;
      })
      .addCase(addProductReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setCurrentProduct,
  clearCurrentProduct,
  clearError,
  setLoading,
} = productSlice.actions;

export default productSlice.reducer;
