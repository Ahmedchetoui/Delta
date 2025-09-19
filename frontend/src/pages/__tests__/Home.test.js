// Mock pour axios avant l'import
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Home from '../Home';
import productSlice from '../../store/slices/productSlice';
import categorySlice from '../../store/slices/categorySlice';

// Mock pour les composants
jest.mock('../../components/ui/Loading', () => {
  return function MockLoading({ text }) {
    return <div data-testid="loading">{text}</div>;
  };
});

jest.mock('../../components/ui/HeroSlider', () => {
  return function MockHeroSlider() {
    return <div data-testid="hero-slider">Hero Slider</div>;
  };
});

jest.mock('../../components/product/ProductCard', () => {
  return function MockProductCard({ product }) {
    return (
      <div data-testid="product-card">
        <h3>{product.name}</h3>
        <p>{product.finalPrice}€</p>
      </div>
    );
  };
});

// Helper pour créer un store de test
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      product: productSlice,
      category: categorySlice,
    },
    preloadedState: {
      product: {
        products: [],
        featuredProducts: [],
        loading: false,
        error: null,
        ...initialState.product,
      },
      category: {
        categories: [],
        loading: false,
        error: null,
        ...initialState.category,
      },
    },
  });
};

// Helper pour wrapper les composants avec les providers nécessaires
const renderWithProviders = (component, { store = createTestStore() } = {}) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

// Données de test
const mockCategories = [
  { _id: '1', name: 'Homme' },
  { _id: '2', name: 'Femme' },
  { _id: '3', name: 'Enfant' },
];

const mockFeaturedProducts = [
  {
    _id: '1',
    name: 'Chemise en coton',
    finalPrice: 49.99,
    images: ['/api/images/chemise.jpg'],
  },
  {
    _id: '2',
    name: 'Robe d\'été',
    finalPrice: 79.99,
    images: ['/api/images/robe.jpg'],
  },
];

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu de base', () => {
    test('affiche la page d\'accueil', async () => {
      const store = createTestStore({
        product: {
          featuredProducts: mockFeaturedProducts,
          loading: false,
        },
        category: {
          categories: mockCategories,
          loading: false,
        },
      });

      await act(async () => {
        renderWithProviders(<Home />, { store });
      });

      // Vérifier que les éléments principaux sont présents
      expect(screen.getByTestId('hero-slider')).toBeInTheDocument();
    });

    test('affiche les catégories', async () => {
      const store = createTestStore({
        category: {
          categories: mockCategories,
          loading: false,
        },
      });

      await act(async () => {
        renderWithProviders(<Home />, { store });
      });

      // Vérifier que les catégories sont affichées
      expect(screen.getByText('Homme')).toBeInTheDocument();
      expect(screen.getByText('Femme')).toBeInTheDocument();
      expect(screen.getByText('Enfant')).toBeInTheDocument();
    });

    test('affiche les produits vedettes', async () => {
      const store = createTestStore({
        product: {
          featuredProducts: mockFeaturedProducts,
          loading: false,
        },
      });

      await act(async () => {
        renderWithProviders(<Home />, { store });
      });

      // Vérifier que les produits vedettes sont affichés
      expect(screen.getByText('Chemise en coton')).toBeInTheDocument();
      expect(screen.getByText('Robe d\'été')).toBeInTheDocument();
    });
  });

  describe('États de chargement', () => {
    test('affiche le loading pour les produits', async () => {
      const store = createTestStore({
        product: {
          loading: true,
        },
      });

      await act(async () => {
        renderWithProviders(<Home />, { store });
      });

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    test('affiche le loading pour les catégories', async () => {
      const store = createTestStore({
        category: {
          loading: true,
        },
      });

      await act(async () => {
        renderWithProviders(<Home />, { store });
      });

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  describe('Gestion des erreurs', () => {
    test('gère les erreurs de chargement des produits', async () => {
      const store = createTestStore({
        product: {
          error: 'Erreur de chargement des produits',
          loading: false,
        },
      });

      await act(async () => {
        renderWithProviders(<Home />, { store });
      });

      // Le composant devrait toujours s'afficher même en cas d'erreur
      expect(screen.getByTestId('hero-slider')).toBeInTheDocument();
    });
  });
});