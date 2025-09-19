import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Navigation
  isMobileMenuOpen: false,
  
  // Modals
  isLoginModalOpen: false,
  isRegisterModalOpen: false,
  isSearchModalOpen: false,
  isFilterModalOpen: false,
  
  // Loading states
  isPageLoading: false,
  isGlobalLoading: false,
  
  // Notifications
  notifications: [],
  
  // Theme
  theme: 'light', // 'light' ou 'dark'
  
  // Language
  language: 'fr',
  
  // Currency
  currency: 'TND',
  
  // Layout
  sidebarCollapsed: false,
  
  // Search
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  
  // Filters
  activeFilters: {},
  
  // Pagination
  currentPage: 1,
  itemsPerPage: 12,
  
  // Sort
  sortBy: 'newest',
  sortOrder: 'desc',
  
  // View mode (pour les listes de produits)
  viewMode: 'grid', // 'grid' ou 'list'
  
  // Error states
  globalError: null,
  
  // Success messages
  successMessage: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Navigation
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false;
    },
    openMobileMenu: (state) => {
      state.isMobileMenuOpen = true;
    },
    
    // Modals
    toggleLoginModal: (state) => {
      state.isLoginModalOpen = !state.isLoginModalOpen;
    },
    openLoginModal: (state) => {
      state.isLoginModalOpen = true;
    },
    closeLoginModal: (state) => {
      state.isLoginModalOpen = false;
    },
    
    toggleRegisterModal: (state) => {
      state.isRegisterModalOpen = !state.isRegisterModalOpen;
    },
    openRegisterModal: (state) => {
      state.isRegisterModalOpen = true;
    },
    closeRegisterModal: (state) => {
      state.isRegisterModalOpen = false;
    },
    
    toggleSearchModal: (state) => {
      state.isSearchModalOpen = !state.isSearchModalOpen;
    },
    openSearchModal: (state) => {
      state.isSearchModalOpen = true;
    },
    closeSearchModal: (state) => {
      state.isSearchModalOpen = false;
    },
    
    toggleFilterModal: (state) => {
      state.isFilterModalOpen = !state.isFilterModalOpen;
    },
    openFilterModal: (state) => {
      state.isFilterModalOpen = true;
    },
    closeFilterModal: (state) => {
      state.isFilterModalOpen = false;
    },
    
    // Loading states
    setPageLoading: (state, action) => {
      state.isPageLoading = action.payload;
    },
    setGlobalLoading: (state, action) => {
      state.isGlobalLoading = action.payload;
    },
    
    // Notifications
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Theme
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
    },
    
    // Language
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
    
    // Currency
    setCurrency: (state, action) => {
      state.currency = action.payload;
      localStorage.setItem('currency', action.payload);
    },
    
    // Layout
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
    
    // Search
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    setSearching: (state, action) => {
      state.isSearching = action.payload;
    },
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
      state.isSearching = false;
    },
    
    // Filters
    setActiveFilters: (state, action) => {
      state.activeFilters = { ...state.activeFilters, ...action.payload };
    },
    clearActiveFilters: (state) => {
      state.activeFilters = {};
    },
    removeFilter: (state, action) => {
      const { [action.payload]: removed, ...rest } = state.activeFilters;
      state.activeFilters = rest;
    },
    
    // Pagination
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setItemsPerPage: (state, action) => {
      state.itemsPerPage = action.payload;
    },
    nextPage: (state) => {
      state.currentPage += 1;
    },
    prevPage: (state) => {
      state.currentPage = Math.max(1, state.currentPage - 1);
    },
    
    // Sort
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action) => {
      state.sortOrder = action.payload;
    },
    setSorting: (state, action) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    
    // View mode
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
      localStorage.setItem('viewMode', action.payload);
    },
    toggleViewMode: (state) => {
      state.viewMode = state.viewMode === 'grid' ? 'list' : 'grid';
      localStorage.setItem('viewMode', state.viewMode);
    },
    
    // Error states
    setGlobalError: (state, action) => {
      state.globalError = action.payload;
    },
    clearGlobalError: (state) => {
      state.globalError = null;
    },
    
    // Success messages
    setSuccessMessage: (state, action) => {
      state.successMessage = action.payload;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    
    // Reset UI state
    resetUI: (state) => {
      return {
        ...initialState,
        theme: state.theme,
        language: state.language,
        currency: state.currency,
        viewMode: state.viewMode,
      };
    },
  },
});

export const {
  // Navigation
  toggleMobileMenu,
  closeMobileMenu,
  openMobileMenu,
  
  // Modals
  toggleLoginModal,
  openLoginModal,
  closeLoginModal,
  toggleRegisterModal,
  openRegisterModal,
  closeRegisterModal,
  toggleSearchModal,
  openSearchModal,
  closeSearchModal,
  toggleFilterModal,
  openFilterModal,
  closeFilterModal,
  
  // Loading states
  setPageLoading,
  setGlobalLoading,
  
  // Notifications
  addNotification,
  removeNotification,
  clearNotifications,
  
  // Theme
  setTheme,
  toggleTheme,
  
  // Language
  setLanguage,
  
  // Currency
  setCurrency,
  
  // Layout
  toggleSidebar,
  setSidebarCollapsed,
  
  // Search
  setSearchQuery,
  setSearchResults,
  setSearching,
  clearSearch,
  
  // Filters
  setActiveFilters,
  clearActiveFilters,
  removeFilter,
  
  // Pagination
  setCurrentPage,
  setItemsPerPage,
  nextPage,
  prevPage,
  
  // Sort
  setSortBy,
  setSortOrder,
  setSorting,
  
  // View mode
  setViewMode,
  toggleViewMode,
  
  // Error states
  setGlobalError,
  clearGlobalError,
  
  // Success messages
  setSuccessMessage,
  clearSuccessMessage,
  
  // Reset UI state
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;
