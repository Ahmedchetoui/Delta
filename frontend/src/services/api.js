import axios from 'axios';

// Configuration de base d'axios
let API_BASE_URL = process.env.REACT_APP_API_URL || 'https://delta-n5d8.onrender.com/api';
// Normaliser pour garantir le préfixe /api
if (/^https?:\/\//i.test(API_BASE_URL)) {
  const url = new URL(API_BASE_URL);
  if (!url.pathname.startsWith('/api')) {
    url.pathname = '/api' + (url.pathname === '/' ? '' : url.pathname);
    API_BASE_URL = url.toString().replace(/\/$/, '');
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 secondes timeout
  withCredentials: true, // Inclure les cookies pour CORS
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Laisser axios définir automatiquement le Content-Type.
    // Si c'est du FormData, axios utilisera 'multipart/form-data' avec boundary.
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Gestion des erreurs CORS
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('Erreur réseau - Vérifiez la configuration CORS:', error);
      // Ne pas rediriger automatiquement pour les erreurs réseau
      return Promise.reject({
        ...error,
        message: 'Erreur de connexion au serveur. Vérifiez votre connexion internet.'
      });
    }

    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      // Ne supprimer le token que si ce n'est pas une tentative de login
      const isLoginAttempt = error.config?.url?.includes('/auth/login');
      if (!isLoginAttempt) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Gestion des erreurs CORS spécifiques
    if (error.response?.status === 0 || error.code === 'ERR_BLOCKED_BY_CLIENT') {
      console.error('Requête bloquée par CORS:', error);
      return Promise.reject({
        ...error,
        message: 'Accès bloqué par la politique CORS. Contactez l\'administrateur.'
      });
    }

    return Promise.reject(error);
  }
);

// Services d'authentification
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/password', passwordData),
};

// Services des produits
export const productService = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  searchProducts: (query) => api.get(`/products/search?q=${query}`),
  getFeaturedProducts: () => api.get('/products/featured'),
  getNewProducts: () => api.get('/products/new'),
  getOnSaleProducts: () => api.get('/products/on-sale'),
};

// Services des catégories
export const categoryService = {
  getCategories: (params) => api.get('/categories', { params }),
  getCategory: (id) => api.get(`/categories/${id}`),
  createCategory: (categoryData) => api.post('/categories', categoryData),
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  getCategoryTree: () => api.get('/categories/tree'),
};

// Services des commandes
export const orderService = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrders: () => api.get('/orders'),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
  trackOrder: (orderNumber) => api.get(`/orders/track/${orderNumber}`),
};

// Services des utilisateurs
export const userService = {
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  addToWishlist: (productId) => api.post(`/users/wishlist/${productId}`),
  removeFromWishlist: (productId) => api.delete(`/users/wishlist/${productId}`),
  getWishlist: () => api.get('/users/wishlist'),
};

// Services admin
export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStats: () => api.get('/admin/stats'),
  getAnalytics: (period) => api.get(`/admin/analytics?period=${period}`),

  // Gestion des commandes
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  cancelOrder: (id, reason) => api.post(`/admin/orders/${id}/cancel`, { reason }),

  // Autres services
  getCustomers: (params) => api.get('/admin/customers', { params }),
  getProducts: (params) => api.get('/admin/products', { params }),
  getCategories: () => api.get('/admin/categories'),
};

export default api;
export { API_BASE_URL };
