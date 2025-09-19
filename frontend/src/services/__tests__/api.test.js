// Mock pour axios avant l'import
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

import axios from 'axios';
import api, { authService, productService, categoryService, orderService, userService, adminService } from '../api';
const mockedAxios = axios;

// Mock pour localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock pour window.location
delete window.location;
window.location = { href: '' };

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Configuration de base', () => {
    test('utilise la bonne URL de base', () => {
      expect(api.defaults.baseURL).toBe('http://localhost:5000/api');
    });

    test('a les bons headers par défaut', () => {
      expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Intercepteur de requête', () => {
    test('ajoute le token d\'authentification si disponible', () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      
      const config = { headers: {} };
      const interceptor = api.interceptors.request.handlers[0].fulfilled;
      
      const result = interceptor(config);
      
      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    test('ne modifie pas la config si pas de token', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const config = { headers: {} };
      const interceptor = api.interceptors.request.handlers[0].fulfilled;
      
      const result = interceptor(config);
      
      expect(result.headers.Authorization).toBeUndefined();
    });

    test('gère les erreurs de requête', () => {
      const error = new Error('Request error');
      const interceptor = api.interceptors.request.handlers[0].rejected;
      
      expect(() => interceptor(error)).toThrow('Request error');
    });
  });

  describe('Intercepteur de réponse', () => {
    test('retourne la réponse si succès', () => {
      const response = { data: 'success' };
      const interceptor = api.interceptors.response.handlers[0].fulfilled;
      
      const result = interceptor(response);
      
      expect(result).toBe(response);
    });

    test('gère les erreurs 401 en supprimant le token et redirigeant', () => {
      const error = {
        response: { status: 401 },
      };
      const interceptor = api.interceptors.response.handlers[0].rejected;
      
      interceptor(error);
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
      expect(window.location.href).toBe('/login');
    });

    test('ne fait rien pour les autres erreurs', () => {
      const error = {
        response: { status: 500 },
      };
      const interceptor = api.interceptors.response.handlers[0].rejected;
      
      expect(() => interceptor(error)).toThrow();
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('authService', () => {
    test('login fait un POST vers /auth/login', () => {
      const credentials = { email: 'test@example.com', password: 'password' };
      
      authService.login(credentials);
      
      expect(mockedAxios.create().post).toHaveBeenCalledWith('/auth/login', credentials);
    });

    test('register fait un POST vers /auth/register', () => {
      const userData = { name: 'John', email: 'john@example.com', password: 'password' };
      
      authService.register(userData);
      
      expect(mockedAxios.create().post).toHaveBeenCalledWith('/auth/register', userData);
    });

    test('getProfile fait un GET vers /auth/me', () => {
      authService.getProfile();
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/auth/me');
    });

    test('updateProfile fait un PUT vers /auth/profile', () => {
      const userData = { name: 'John Updated' };
      
      authService.updateProfile(userData);
      
      expect(mockedAxios.create().put).toHaveBeenCalledWith('/auth/profile', userData);
    });

    test('changePassword fait un PUT vers /auth/password', () => {
      const passwordData = { currentPassword: 'old', newPassword: 'new' };
      
      authService.changePassword(passwordData);
      
      expect(mockedAxios.create().put).toHaveBeenCalledWith('/auth/password', passwordData);
    });
  });

  describe('productService', () => {
    test('getProducts fait un GET vers /products avec des paramètres', () => {
      const params = { category: '1', page: 1 };
      
      productService.getProducts(params);
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/products', { params });
    });

    test('getProduct fait un GET vers /products/:id', () => {
      const productId = '123';
      
      productService.getProduct(productId);
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/products/123');
    });

    test('createProduct fait un POST vers /products', () => {
      const productData = { name: 'New Product', price: 99.99 };
      
      productService.createProduct(productData);
      
      expect(mockedAxios.create().post).toHaveBeenCalledWith('/products', productData);
    });

    test('updateProduct fait un PUT vers /products/:id', () => {
      const productId = '123';
      const productData = { name: 'Updated Product' };
      
      productService.updateProduct(productId, productData);
      
      expect(mockedAxios.create().put).toHaveBeenCalledWith('/products/123', productData);
    });

    test('deleteProduct fait un DELETE vers /products/:id', () => {
      const productId = '123';
      
      productService.deleteProduct(productId);
      
      expect(mockedAxios.create().delete).toHaveBeenCalledWith('/products/123');
    });

    test('searchProducts fait un GET vers /products/search', () => {
      const query = 'chemise';
      
      productService.searchProducts(query);
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/products/search?q=chemise');
    });

    test('getFeaturedProducts fait un GET vers /products/featured', () => {
      productService.getFeaturedProducts();
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/products/featured');
    });

    test('getNewProducts fait un GET vers /products/new', () => {
      productService.getNewProducts();
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/products/new');
    });

    test('getOnSaleProducts fait un GET vers /products/on-sale', () => {
      productService.getOnSaleProducts();
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/products/on-sale');
    });
  });

  describe('categoryService', () => {
    test('getCategories fait un GET vers /categories', () => {
      categoryService.getCategories();
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/categories');
    });

    test('getCategory fait un GET vers /categories/:id', () => {
      const categoryId = '123';
      
      categoryService.getCategory(categoryId);
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/categories/123');
    });

    test('createCategory fait un POST vers /categories', () => {
      const categoryData = { name: 'New Category' };
      
      categoryService.createCategory(categoryData);
      
      expect(mockedAxios.create().post).toHaveBeenCalledWith('/categories', categoryData);
    });

    test('updateCategory fait un PUT vers /categories/:id', () => {
      const categoryId = '123';
      const categoryData = { name: 'Updated Category' };
      
      categoryService.updateCategory(categoryId, categoryData);
      
      expect(mockedAxios.create().put).toHaveBeenCalledWith('/categories/123', categoryData);
    });

    test('deleteCategory fait un DELETE vers /categories/:id', () => {
      const categoryId = '123';
      
      categoryService.deleteCategory(categoryId);
      
      expect(mockedAxios.create().delete).toHaveBeenCalledWith('/categories/123');
    });

    test('getCategoryTree fait un GET vers /categories/tree', () => {
      categoryService.getCategoryTree();
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/categories/tree');
    });
  });

  describe('orderService', () => {
    test('createOrder fait un POST vers /orders', () => {
      const orderData = { items: [], total: 100 };
      
      orderService.createOrder(orderData);
      
      expect(mockedAxios.create().post).toHaveBeenCalledWith('/orders', orderData);
    });

    test('getOrders fait un GET vers /orders', () => {
      orderService.getOrders();
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/orders');
    });

    test('getOrder fait un GET vers /orders/:id', () => {
      const orderId = '123';
      
      orderService.getOrder(orderId);
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/orders/123');
    });

    test('cancelOrder fait un PUT vers /orders/:id/cancel', () => {
      const orderId = '123';
      
      orderService.cancelOrder(orderId);
      
      expect(mockedAxios.create().put).toHaveBeenCalledWith('/orders/123/cancel');
    });

    test('trackOrder fait un GET vers /orders/track/:orderNumber', () => {
      const orderNumber = 'ORD-123';
      
      orderService.trackOrder(orderNumber);
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/orders/track/ORD-123');
    });
  });

  describe('userService', () => {
    test('getUsers fait un GET vers /users', () => {
      userService.getUsers();
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/users');
    });

    test('getUser fait un GET vers /users/:id', () => {
      const userId = '123';
      
      userService.getUser(userId);
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/users/123');
    });

    test('updateUser fait un PUT vers /users/:id', () => {
      const userId = '123';
      const userData = { name: 'Updated User' };
      
      userService.updateUser(userId, userData);
      
      expect(mockedAxios.create().put).toHaveBeenCalledWith('/users/123', userData);
    });

    test('deleteUser fait un DELETE vers /users/:id', () => {
      const userId = '123';
      
      userService.deleteUser(userId);
      
      expect(mockedAxios.create().delete).toHaveBeenCalledWith('/users/123');
    });

    test('addToWishlist fait un POST vers /users/wishlist/:productId', () => {
      const productId = '123';
      
      userService.addToWishlist(productId);
      
      expect(mockedAxios.create().post).toHaveBeenCalledWith('/users/wishlist/123');
    });

    test('removeFromWishlist fait un DELETE vers /users/wishlist/:productId', () => {
      const productId = '123';
      
      userService.removeFromWishlist(productId);
      
      expect(mockedAxios.create().delete).toHaveBeenCalledWith('/users/wishlist/123');
    });

    test('getWishlist fait un GET vers /users/wishlist', () => {
      userService.getWishlist();
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/users/wishlist');
    });
  });

  describe('adminService', () => {
    test('getDashboard fait un GET vers /admin/dashboard', () => {
      adminService.getDashboard();
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/admin/dashboard');
    });

    test('getStats fait un GET vers /admin/stats', () => {
      adminService.getStats();
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/admin/stats');
    });

    test('getAnalytics fait un GET vers /admin/analytics avec période', () => {
      const period = '30d';
      
      adminService.getAnalytics(period);
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/admin/analytics?period=30d');
    });

    test('getOrders fait un GET vers /admin/orders avec paramètres', () => {
      const params = { status: 'pending' };
      
      adminService.getOrders(params);
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/admin/orders', { params });
    });

    test('updateOrderStatus fait un PUT vers /admin/orders/:id/status', () => {
      const orderId = '123';
      const status = 'shipped';
      
      adminService.updateOrderStatus(orderId, status);
      
      expect(mockedAxios.create().put).toHaveBeenCalledWith('/admin/orders/123/status', { status });
    });

    test('getCustomers fait un GET vers /admin/customers avec paramètres', () => {
      const params = { page: 1 };
      
      adminService.getCustomers(params);
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/admin/customers', { params });
    });

    test('getProducts fait un GET vers /admin/products avec paramètres', () => {
      const params = { category: '1' };
      
      adminService.getProducts(params);
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/admin/products', { params });
    });

    test('getCategories fait un GET vers /admin/categories', () => {
      adminService.getCategories();
      
      expect(mockedAxios.create().get).toHaveBeenCalledWith('/admin/categories');
    });
  });

  describe('Gestion des erreurs', () => {
    test('gère les erreurs de réseau', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.create().get.mockRejectedValue(networkError);
      
      await expect(productService.getProducts()).rejects.toThrow('Network Error');
    });

    test('gère les erreurs de validation', async () => {
      const validationError = {
        response: {
          status: 400,
          data: { message: 'Validation failed' },
        },
      };
      mockedAxios.create().post.mockRejectedValue(validationError);
      
      await expect(authService.login({})).rejects.toEqual(validationError);
    });
  });

  describe('Variables d\'environnement', () => {
    test('utilise REACT_APP_API_URL si définie', () => {
      const originalEnv = process.env.REACT_APP_API_URL;
      process.env.REACT_APP_API_URL = 'https://api.example.com';
      
      // Recréer l'instance API pour tester la nouvelle URL
      const newApi = require('../api').default;
      
      expect(newApi.defaults.baseURL).toBe('https://api.example.com');
      
      // Restaurer l'environnement
      process.env.REACT_APP_API_URL = originalEnv;
    });
  });
});
