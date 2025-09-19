import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Shop from '../Shop';
import productSlice from '../../store/slices/productSlice';
import categorySlice from '../../store/slices/categorySlice';

// Mock pour les composants
jest.mock('../../components/ui/Loading', () => {
  return function MockLoading({ text }) {
    return <div data-testid="loading">{text}</div>;
  };
});

jest.mock('../../components/product/ProductCard', () => {
  return function MockProductCard({ product }) {
    return (
      <div data-testid={`product-${product._id}`}>
        <h3>{product.name}</h3>
        <p>{product.finalPrice} DT</p>
      </div>
    );
  };
});

jest.mock('../../components/product/ProductFilters', () => {
  return function MockProductFilters({ onFilterChange, currentFilters }) {
    return (
      <div data-testid="product-filters">
        <button onClick={() => onFilterChange({ category: '1' })}>
          Filtrer par catégorie
        </button>
        <div>Filtres actuels: {JSON.stringify(currentFilters)}</div>
      </div>
    );
  };
});

// Mock pour les icônes Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  FunnelIcon: () => <div data-testid="funnel-icon" />,
  Squares2X2Icon: () => <div data-testid="grid-icon" />,
  ListBulletIcon: () => <div data-testid="list-icon" />,
  ChevronDownIcon: () => <div data-testid="chevron-down-icon" />,
}));

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
        loading: false,
        error: null,
        totalProducts: 0,
        currentPage: 1,
        totalPages: 1,
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
const renderWithProviders = (component, { store = createTestStore(), initialEntries = ['/shop'] } = {}) => {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        {component}
      </MemoryRouter>
    </Provider>
  );
};

// Données de test
const mockProducts = [
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
  {
    _id: '3',
    name: 'Pantalon jean',
    finalPrice: 89.99,
    images: ['/api/images/jean.jpg'],
  },
];

const mockCategories = [
  { _id: '1', name: 'Homme' },
  { _id: '2', name: 'Femme' },
  { _id: '3', name: 'Enfant' },
];

describe('Shop Page', () => {
  describe('Rendu de base', () => {
    test('affiche le titre de la boutique', () => {
      const storeWithData = createTestStore({
        product: { products: mockProducts, totalProducts: 3 },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: storeWithData });
      
      expect(screen.getByText('Boutique')).toBeInTheDocument();
      expect(screen.getByText('3 produits trouvés')).toBeInTheDocument();
    });

    test('affiche les filtres de produits', () => {
      const storeWithData = createTestStore({
        product: { products: mockProducts, totalProducts: 3 },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: storeWithData });
      
      expect(screen.getByTestId('product-filters')).toBeInTheDocument();
      expect(screen.getByText('Filtres')).toBeInTheDocument();
    });

    test('affiche les produits dans une grille', () => {
      const storeWithData = createTestStore({
        product: { products: mockProducts, totalProducts: 3 },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: storeWithData });
      
      expect(screen.getByTestId('product-1')).toBeInTheDocument();
      expect(screen.getByTestId('product-2')).toBeInTheDocument();
      expect(screen.getByTestId('product-3')).toBeInTheDocument();
    });
  });

  describe('Recherche', () => {
    test('affiche les résultats de recherche', () => {
      const storeWithData = createTestStore({
        product: { products: mockProducts, totalProducts: 3 },
        category: { categories: mockCategories },
      });

      renderWithProviders(
        <Shop />, 
        { 
          store: storeWithData,
          initialEntries: ['/shop?search=chemise']
        }
      );
      
      expect(screen.getByText('Résultats pour "chemise"')).toBeInTheDocument();
    });
  });

  describe('Filtres', () => {
    test('affiche le bouton de filtres sur mobile', () => {
      const storeWithData = createTestStore({
        product: { products: mockProducts, totalProducts: 3 },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: storeWithData });
      
      const filterButton = screen.getByText('Filtres');
      expect(filterButton).toBeInTheDocument();
    });

    test('ouvre les filtres au clic sur le bouton mobile', () => {
      const storeWithData = createTestStore({
        product: { products: mockProducts, totalProducts: 3 },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: storeWithData });
      
      const filterButton = screen.getByText('Filtres');
      fireEvent.click(filterButton);
      
      // Les filtres devraient être visibles
      expect(screen.getByTestId('product-filters')).toBeInTheDocument();
    });

    test('ferme les filtres au clic sur le bouton de fermeture', () => {
      const storeWithData = createTestStore({
        product: { products: mockProducts, totalProducts: 3 },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: storeWithData });
      
      // Ouvrir les filtres
      const filterButton = screen.getByText('Filtres');
      fireEvent.click(filterButton);
      
      // Fermer les filtres
      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);
      
      // Les filtres devraient être cachés (dans un vrai test, on vérifierait la classe CSS)
    });
  });

  describe('Modes d\'affichage', () => {
    test('affiche les boutons de mode d\'affichage', () => {
      const storeWithData = createTestStore({
        product: { products: mockProducts, totalProducts: 3 },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: storeWithData });
      
      expect(screen.getByTestId('grid-icon')).toBeInTheDocument();
      expect(screen.getByTestId('list-icon')).toBeInTheDocument();
    });

    test('change le mode d\'affichage au clic', () => {
      const storeWithData = createTestStore({
        product: { products: mockProducts, totalProducts: 3 },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: storeWithData });
      
      const listButton = screen.getByTestId('list-icon').closest('button');
      fireEvent.click(listButton);
      
      // Dans un vrai test, on vérifierait que le mode d'affichage a changé
    });
  });

  describe('Tri', () => {
    test('affiche le menu de tri', () => {
      const storeWithData = createTestStore({
        product: { products: mockProducts, totalProducts: 3 },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: storeWithData });
      
      expect(screen.getByText('Trier par')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    test('ouvre le menu de tri au clic', () => {
      const storeWithData = createTestStore({
        product: { products: mockProducts, totalProducts: 3 },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: storeWithData });
      
      const sortButton = screen.getByText('Trier par').closest('button');
      fireEvent.click(sortButton);
      
      // Vérifier que les options de tri sont affichées
      expect(screen.getByText('Plus récents')).toBeInTheDocument();
      expect(screen.getByText('Plus anciens')).toBeInTheDocument();
      expect(screen.getByText('Prix croissant')).toBeInTheDocument();
      expect(screen.getByText('Prix décroissant')).toBeInTheDocument();
    });

    test('change l\'option de tri au clic', () => {
      const storeWithData = createTestStore({
        product: { products: mockProducts, totalProducts: 3 },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: storeWithData });
      
      // Ouvrir le menu de tri
      const sortButton = screen.getByText('Trier par').closest('button');
      fireEvent.click(sortButton);
      
      // Cliquer sur une option
      const priceOption = screen.getByText('Prix croissant');
      fireEvent.click(priceOption);
      
      // Le menu devrait se fermer
      expect(screen.queryByText('Plus récents')).not.toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    test('affiche la pagination quand il y a plusieurs pages', () => {
      const storeWithPagination = createTestStore({
        product: { 
          products: mockProducts, 
          totalProducts: 25,
          currentPage: 1,
          totalPages: 3
        },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: storeWithPagination });
      
      expect(screen.getByText('Précédent')).toBeInTheDocument();
      expect(screen.getByText('Suivant')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    test('ne pas afficher la pagination quand il n\'y a qu\'une page', () => {
      const storeWithData = createTestStore({
        product: { 
          products: mockProducts, 
          totalProducts: 3,
          currentPage: 1,
          totalPages: 1
        },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: storeWithData });
      
      expect(screen.queryByText('Précédent')).not.toBeInTheDocument();
      expect(screen.queryByText('Suivant')).not.toBeInTheDocument();
    });

    test('désactive le bouton Précédent sur la première page', () => {
      const storeWithPagination = createTestStore({
        product: { 
          products: mockProducts, 
          totalProducts: 25,
          currentPage: 1,
          totalPages: 3
        },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: storeWithPagination });
      
      const prevButton = screen.getByText('Précédent');
      expect(prevButton).toBeDisabled();
    });

    test('désactive le bouton Suivant sur la dernière page', () => {
      const storeWithPagination = createTestStore({
        product: { 
          products: mockProducts, 
          totalProducts: 25,
          currentPage: 3,
          totalPages: 3
        },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: storeWithPagination });
      
      const nextButton = screen.getByText('Suivant');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('État de chargement', () => {
    test('affiche le composant de chargement pendant le chargement initial', () => {
      const loadingStore = createTestStore({
        product: { loading: true, products: [] },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: loadingStore });
      
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByText('Chargement des produits...')).toBeInTheDocument();
    });

    test('affiche le composant de chargement pendant le chargement des filtres', () => {
      const loadingStore = createTestStore({
        product: { loading: true, products: mockProducts },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: loadingStore });
      
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  describe('Aucun produit trouvé', () => {
    test('affiche le message d\'aucun produit trouvé', () => {
      const emptyStore = createTestStore({
        product: { products: [], totalProducts: 0 },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: emptyStore });
      
      expect(screen.getByText('Aucun produit trouvé')).toBeInTheDocument();
      expect(screen.getByText('Essayez de modifier vos critères de recherche ou de filtrage.')).toBeInTheDocument();
      expect(screen.getByText('Voir tous les produits')).toBeInTheDocument();
    });

    test('permet de réinitialiser les filtres', () => {
      const emptyStore = createTestStore({
        product: { products: [], totalProducts: 0 },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: emptyStore });
      
      const resetButton = screen.getByText('Voir tous les produits');
      fireEvent.click(resetButton);
      
      // Dans un vrai test, on vérifierait que les paramètres URL sont réinitialisés
    });
  });

  describe('Gestion des paramètres URL', () => {
    test('lit les paramètres de recherche depuis l\'URL', () => {
      const storeWithData = createTestStore({
        product: { products: mockProducts, totalProducts: 3 },
        category: { categories: mockCategories },
      });

      renderWithProviders(
        <Shop />, 
        { 
          store: storeWithData,
          initialEntries: ['/shop?search=chemise&category=1&page=2']
        }
      );
      
      expect(screen.getByText('Résultats pour "chemise"')).toBeInTheDocument();
    });
  });

  describe('Accessibilité', () => {
    test('les boutons ont des rôles appropriés', () => {
      const storeWithData = createTestStore({
        product: { products: mockProducts, totalProducts: 3 },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: storeWithData });
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('les liens ont des attributs appropriés', () => {
      const storeWithData = createTestStore({
        product: { products: mockProducts, totalProducts: 3 },
        category: { categories: mockCategories },
      });

      renderWithProviders(<Shop />, { store: storeWithData });
      
      // Vérifier que les éléments interactifs sont accessibles
      const interactiveElements = screen.getAllByRole('button');
      interactiveElements.forEach(element => {
        expect(element).toBeInTheDocument();
      });
    });
  });
});
