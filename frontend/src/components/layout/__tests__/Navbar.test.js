import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Navbar from '../Navbar';
import authSlice from '../../../store/slices/authSlice';
import cartSlice from '../../../store/slices/cartSlice';

// Mock pour useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock pour les icônes Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ShoppingCartIcon: () => <div data-testid="shopping-cart-icon" />,
  UserIcon: () => <div data-testid="user-icon" />,
  MagnifyingGlassIcon: () => <div data-testid="search-icon" />,
  Bars3Icon: () => <div data-testid="menu-icon" />,
  XMarkIcon: () => <div data-testid="close-icon" />,
}));

// Helper pour créer un store de test
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      cart: cartSlice,
    },
    preloadedState: {
      auth: {
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        ...initialState.auth,
      },
      cart: {
        items: [],
        total: 0,
        ...initialState.cart,
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

describe('Navbar Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Rendu de base', () => {
    test('affiche le logo Delta Fashion', () => {
      renderWithProviders(<Navbar />);
      expect(screen.getByText('Delta Fashion')).toBeInTheDocument();
    });

    test('affiche les liens de navigation principaux', () => {
      renderWithProviders(<Navbar />);
      expect(screen.getByText('Accueil')).toBeInTheDocument();
      expect(screen.getByText('Boutique')).toBeInTheDocument();
      expect(screen.getByText('À propos')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    test('affiche la barre de recherche', () => {
      renderWithProviders(<Navbar />);
      expect(screen.getByPlaceholderText('Rechercher des produits...')).toBeInTheDocument();
    });

    test('affiche l\'icône du panier', () => {
      renderWithProviders(<Navbar />);
      expect(screen.getByTestId('shopping-cart-icon')).toBeInTheDocument();
    });
  });

  describe('État non authentifié', () => {
    test('affiche les liens de connexion et d\'inscription', () => {
      renderWithProviders(<Navbar />);
      expect(screen.getByText('Connexion')).toBeInTheDocument();
      expect(screen.getByText('S\'inscrire')).toBeInTheDocument();
    });

    test('ne montre pas le menu utilisateur', () => {
      renderWithProviders(<Navbar />);
      expect(screen.queryByText('Mon Profil')).not.toBeInTheDocument();
      expect(screen.queryByText('Mes Commandes')).not.toBeInTheDocument();
    });
  });

  describe('État authentifié', () => {
    const authenticatedStore = createTestStore({
      auth: {
        user: {
          _id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: 'user',
        },
        isAuthenticated: true,
      },
    });

    test('affiche le nom de l\'utilisateur', () => {
      renderWithProviders(<Navbar />, { store: authenticatedStore });
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    test('affiche le menu utilisateur au survol', async () => {
      renderWithProviders(<Navbar />, { store: authenticatedStore });
      
      const userButton = screen.getByText('John');
      fireEvent.mouseEnter(userButton);
      
      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
        expect(screen.getByText('Mes Commandes')).toBeInTheDocument();
        expect(screen.getByText('Déconnexion')).toBeInTheDocument();
      });
    });
  });

  describe('Utilisateur administrateur', () => {
    const adminStore = createTestStore({
      auth: {
        user: {
          _id: '1',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          role: 'admin',
        },
        isAuthenticated: true,
      },
    });

    test('affiche le lien d\'administration pour les admins', async () => {
      renderWithProviders(<Navbar />, { store: adminStore });
      
      const userButton = screen.getByText('Admin');
      fireEvent.mouseEnter(userButton);
      
      await waitFor(() => {
        expect(screen.getByText('Administration')).toBeInTheDocument();
      });
    });
  });

  describe('Fonctionnalité de recherche', () => {
    test('permet de saisir une requête de recherche', () => {
      renderWithProviders(<Navbar />);
      const searchInput = screen.getByPlaceholderText('Rechercher des produits...');
      
      fireEvent.change(searchInput, { target: { value: 'chemise' } });
      expect(searchInput.value).toBe('chemise');
    });

    test('navigue vers la page shop avec la requête de recherche', () => {
      renderWithProviders(<Navbar />);
      const searchInput = screen.getByPlaceholderText('Rechercher des produits...');
      const form = searchInput.closest('form');
      
      fireEvent.change(searchInput, { target: { value: 'chemise' } });
      fireEvent.submit(form);
      
      expect(mockNavigate).toHaveBeenCalledWith('/shop?search=chemise');
    });

    test('ne navigue pas avec une requête vide', () => {
      renderWithProviders(<Navbar />);
      const searchInput = screen.getByPlaceholderText('Rechercher des produits...');
      const form = searchInput.closest('form');
      
      fireEvent.change(searchInput, { target: { value: '   ' } });
      fireEvent.submit(form);
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Panier', () => {
    test('affiche le nombre d\'articles dans le panier', () => {
      const storeWithCart = createTestStore({
        cart: {
          items: [
            { product: '1', quantity: 2 },
            { product: '2', quantity: 1 },
          ],
        },
      });

      renderWithProviders(<Navbar />, { store: storeWithCart });
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    test('ne montre pas le badge si le panier est vide', () => {
      renderWithProviders(<Navbar />);
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  describe('Menu mobile', () => {
    test('affiche le bouton du menu mobile', () => {
      renderWithProviders(<Navbar />);
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    });

    test('ouvre le menu mobile au clic', () => {
      renderWithProviders(<Navbar />);
      const menuButton = screen.getByTestId('menu-icon');
      
      fireEvent.click(menuButton);
      expect(screen.getByTestId('close-icon')).toBeInTheDocument();
    });

    test('affiche la recherche mobile', () => {
      renderWithProviders(<Navbar />);
      const searchButton = screen.getByTestId('search-icon');
      
      fireEvent.click(searchButton);
      expect(screen.getAllByPlaceholderText('Rechercher des produits...')).toHaveLength(2);
    });
  });

  describe('Déconnexion', () => {
    test('déconnecte l\'utilisateur et navigue vers l\'accueil', async () => {
      const authenticatedStore = createTestStore({
        auth: {
          user: {
            _id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'user',
          },
          isAuthenticated: true,
        },
      });

      renderWithProviders(<Navbar />, { store: authenticatedStore });
      
      const userButton = screen.getByText('John');
      fireEvent.mouseEnter(userButton);
      
      await waitFor(() => {
        const logoutButton = screen.getByText('Déconnexion');
        fireEvent.click(logoutButton);
      });
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
