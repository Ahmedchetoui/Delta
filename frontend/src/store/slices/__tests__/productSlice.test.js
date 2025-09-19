import productSlice, {
  fetchProducts,
  fetchProduct,
  fetchProductBySlug,
  fetchFeaturedProducts,
  fetchNewProducts,
  fetchSaleProducts,
  searchProducts,
  addProductReview,
  setFilters,
  clearFilters,
  setCurrentProduct,
  clearCurrentProduct,
  clearError,
  setLoading,
} from '../productSlice';

// Mock pour axios
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));
import axios from 'axios';

// Mock pour localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Données de test
const mockProduct = {
  _id: '1',
  name: 'Chemise en coton',
  price: 49.99,
  finalPrice: 39.99,
  images: ['/api/images/chemise.jpg'],
  category: '1',
  isFeatured: true,
  isNew: false,
  isOnSale: true,
};

const mockProducts = [mockProduct];

const mockPagination = {
  currentPage: 1,
  totalPages: 1,
  totalProducts: 1,
  hasNext: false,
  hasPrev: false,
};

describe('productSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-token');
  });

  describe('État initial', () => {
    test('a l\'état initial correct', () => {
      const initialState = productSlice(undefined, { type: 'unknown' });
      
      expect(initialState).toEqual({
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
      });
    });
  });

  describe('Actions synchrones', () => {
    test('setFilters met à jour les filtres', () => {
      const initialState = productSlice(undefined, { type: 'unknown' });
      
      const newFilters = { category: '1', minPrice: '10', maxPrice: '100' };
      const newState = productSlice(initialState, setFilters(newFilters));
      
      expect(newState.filters).toEqual({
        category: '1',
        minPrice: '10',
        maxPrice: '100',
        search: '',
        sort: 'newest',
        featured: false,
        onSale: false,
        inStock: false,
      });
    });

    test('clearFilters réinitialise les filtres', () => {
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        filters: {
          category: '1',
          minPrice: '10',
          maxPrice: '100',
          search: 'test',
          sort: 'price-low',
          featured: true,
          onSale: true,
          inStock: true,
        },
      };
      
      const newState = productSlice(initialState, clearFilters());
      
      expect(newState.filters).toEqual({
        category: '',
        minPrice: '',
        maxPrice: '',
        search: '',
        sort: 'newest',
        featured: false,
        onSale: false,
        inStock: false,
      });
    });

    test('setCurrentProduct définit le produit actuel', () => {
      const initialState = productSlice(undefined, { type: 'unknown' });
      
      const newState = productSlice(initialState, setCurrentProduct(mockProduct));
      
      expect(newState.currentProduct).toEqual(mockProduct);
    });

    test('clearCurrentProduct supprime le produit actuel', () => {
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        currentProduct: mockProduct,
      };
      
      const newState = productSlice(initialState, clearCurrentProduct());
      
      expect(newState.currentProduct).toBeNull();
    });

    test('clearError supprime l\'erreur', () => {
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        error: 'Some error',
      };
      
      const newState = productSlice(initialState, clearError());
      
      expect(newState.error).toBeNull();
    });

    test('setLoading met à jour l\'état de chargement', () => {
      const initialState = productSlice(undefined, { type: 'unknown' });
      
      const newState = productSlice(initialState, setLoading(true));
      
      expect(newState.isLoading).toBe(true);
    });
  });

  describe('Actions asynchrones - fetchProducts', () => {
    test('fetchProducts.pending met isLoading à true et supprime l\'erreur', () => {
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        isLoading: false,
        error: 'Previous error',
      };
      
      const newState = productSlice(initialState, fetchProducts.pending());
      
      expect(newState.isLoading).toBe(true);
      expect(newState.error).toBeNull();
    });

    test('fetchProducts.fulfilled met à jour les produits et la pagination', () => {
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        isLoading: true,
        error: null,
      };
      
      const mockResponse = {
        products: mockProducts,
        pagination: mockPagination,
      };
      
      const newState = productSlice(initialState, fetchProducts.fulfilled(mockResponse));
      
      expect(newState.isLoading).toBe(false);
      expect(newState.products).toEqual(mockProducts);
      expect(newState.pagination).toEqual(mockPagination);
      expect(newState.error).toBeNull();
    });

    test('fetchProducts.rejected met à jour l\'erreur', () => {
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        isLoading: true,
        error: null,
      };
      
      const errorMessage = 'Erreur de chargement';
      const newState = productSlice(initialState, fetchProducts.rejected(null, null, errorMessage));
      
      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBe(errorMessage);
    });
  });

  describe('Actions asynchrones - fetchProduct', () => {
    test('fetchProduct.fulfilled met à jour le produit actuel', () => {
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        isLoading: true,
        error: null,
      };
      
      const mockResponse = { product: mockProduct };
      
      const newState = productSlice(initialState, fetchProduct.fulfilled(mockResponse));
      
      expect(newState.isLoading).toBe(false);
      expect(newState.currentProduct).toEqual(mockProduct);
      expect(newState.error).toBeNull();
    });

    test('fetchProduct.rejected met à jour l\'erreur', () => {
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        isLoading: true,
        error: null,
      };
      
      const errorMessage = 'Produit non trouvé';
      const newState = productSlice(initialState, fetchProduct.rejected(null, null, errorMessage));
      
      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBe(errorMessage);
    });
  });

  describe('Actions asynchrones - fetchProductBySlug', () => {
    test('fetchProductBySlug.fulfilled met à jour le produit actuel', () => {
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        isLoading: true,
        error: null,
      };
      
      const mockResponse = { product: mockProduct };
      
      const newState = productSlice(initialState, fetchProductBySlug.fulfilled(mockResponse));
      
      expect(newState.isLoading).toBe(false);
      expect(newState.currentProduct).toEqual(mockProduct);
      expect(newState.error).toBeNull();
    });
  });

  describe('Actions asynchrones - fetchFeaturedProducts', () => {
    test('fetchFeaturedProducts.fulfilled met à jour les produits vedettes', () => {
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        isLoading: true,
        error: null,
      };
      
      const mockResponse = { products: mockProducts };
      
      const newState = productSlice(initialState, fetchFeaturedProducts.fulfilled(mockResponse));
      
      expect(newState.isLoading).toBe(false);
      expect(newState.featuredProducts).toEqual(mockProducts);
      expect(newState.error).toBeNull();
    });
  });

  describe('Actions asynchrones - fetchNewProducts', () => {
    test('fetchNewProducts.fulfilled met à jour les nouveaux produits', () => {
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        isLoading: true,
        error: null,
      };
      
      const mockResponse = { products: mockProducts };
      
      const newState = productSlice(initialState, fetchNewProducts.fulfilled(mockResponse));
      
      expect(newState.isLoading).toBe(false);
      expect(newState.newProducts).toEqual(mockProducts);
      expect(newState.error).toBeNull();
    });
  });

  describe('Actions asynchrones - fetchSaleProducts', () => {
    test('fetchSaleProducts.fulfilled met à jour les produits en promotion', () => {
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        isLoading: true,
        error: null,
      };
      
      const mockResponse = { products: mockProducts };
      
      const newState = productSlice(initialState, fetchSaleProducts.fulfilled(mockResponse));
      
      expect(newState.isLoading).toBe(false);
      expect(newState.saleProducts).toEqual(mockProducts);
      expect(newState.error).toBeNull();
    });
  });

  describe('Actions asynchrones - searchProducts', () => {
    test('searchProducts.pending met isSearching à true', () => {
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        isSearching: false,
        error: null,
      };
      
      const newState = productSlice(initialState, searchProducts.pending());
      
      expect(newState.isSearching).toBe(true);
      expect(newState.error).toBeNull();
    });

    test('searchProducts.fulfilled met à jour les produits et la pagination', () => {
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        isSearching: true,
        error: null,
      };
      
      const mockResponse = {
        products: mockProducts,
        pagination: mockPagination,
      };
      
      const newState = productSlice(initialState, searchProducts.fulfilled(mockResponse));
      
      expect(newState.isSearching).toBe(false);
      expect(newState.products).toEqual(mockProducts);
      expect(newState.pagination).toEqual(mockPagination);
      expect(newState.error).toBeNull();
    });

    test('searchProducts.rejected met à jour l\'erreur', () => {
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        isSearching: true,
        error: null,
      };
      
      const errorMessage = 'Erreur de recherche';
      const newState = productSlice(initialState, searchProducts.rejected(null, null, errorMessage));
      
      expect(newState.isSearching).toBe(false);
      expect(newState.error).toBe(errorMessage);
    });
  });

  describe('Actions asynchrones - addProductReview', () => {
    test('addProductReview.fulfilled ajoute l\'avis au produit actuel', () => {
      const mockReview = {
        _id: 'review1',
        rating: 5,
        comment: 'Excellent produit',
        user: { name: 'John Doe' },
      };
      
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        isLoading: true,
        currentProduct: {
          ...mockProduct,
          reviews: [],
        },
        error: null,
      };
      
      const mockResponse = { review: mockReview };
      
      const newState = productSlice(initialState, addProductReview.fulfilled(mockResponse));
      
      expect(newState.isLoading).toBe(false);
      expect(newState.currentProduct.reviews).toContain(mockReview);
      expect(newState.error).toBeNull();
    });

    test('addProductReview.fulfilled ne fait rien si pas de produit actuel', () => {
      const mockReview = {
        _id: 'review1',
        rating: 5,
        comment: 'Excellent produit',
        user: { name: 'John Doe' },
      };
      
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        isLoading: true,
        currentProduct: null,
        error: null,
      };
      
      const mockResponse = { review: mockReview };
      
      const newState = productSlice(initialState, addProductReview.fulfilled(mockResponse));
      
      expect(newState.isLoading).toBe(false);
      expect(newState.currentProduct).toBeNull();
      expect(newState.error).toBeNull();
    });

    test('addProductReview.rejected met à jour l\'erreur', () => {
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        isLoading: true,
        error: null,
      };
      
      const errorMessage = 'Erreur lors de l\'ajout de l\'avis';
      const newState = productSlice(initialState, addProductReview.rejected(null, null, errorMessage));
      
      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBe(errorMessage);
    });
  });

  describe('Gestion des erreurs', () => {
    test('gère les erreurs de réseau', () => {
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        isLoading: true,
        error: null,
      };
      
      const errorMessage = 'Network Error';
      const newState = productSlice(initialState, fetchProducts.rejected(null, null, errorMessage));
      
      expect(newState.error).toBe(errorMessage);
      expect(newState.isLoading).toBe(false);
    });

    test('gère les erreurs avec message personnalisé', () => {
      const initialState = {
        ...productSlice(undefined, { type: 'unknown' }),
        isLoading: true,
        error: null,
      };
      
      const errorMessage = 'Produit non trouvé';
      const newState = productSlice(initialState, fetchProduct.rejected(null, null, errorMessage));
      
      expect(newState.error).toBe(errorMessage);
    });
  });

  describe('États de chargement multiples', () => {
    test('gère correctement isLoading et isSearching séparément', () => {
      const initialState = productSlice(undefined, { type: 'unknown' });
      
      // fetchProducts utilise isLoading
      let newState = productSlice(initialState, fetchProducts.pending());
      expect(newState.isLoading).toBe(true);
      expect(newState.isSearching).toBe(false);
      
      // searchProducts utilise isSearching
      newState = productSlice(newState, searchProducts.pending());
      expect(newState.isLoading).toBe(true);
      expect(newState.isSearching).toBe(true);
      
      // Fin de la recherche
      newState = productSlice(newState, searchProducts.fulfilled({ products: [], pagination: mockPagination }));
      expect(newState.isLoading).toBe(true);
      expect(newState.isSearching).toBe(false);
    });
  });
});
