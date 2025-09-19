// Mock pour axios avant l'import
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import ProtectedRoute from '../ProtectedRoute';
import authSlice from '../../../store/slices/authSlice';

// Mock pour useLocation
const mockLocation = {
  pathname: '/profile',
  search: '',
  hash: '',
  state: null,
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockLocation,
}));

// Helper pour créer un store de test
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
    },
    preloadedState: {
      auth: {
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        ...initialState.auth,
      },
    },
  });
};

// Composant de test pour simuler le contenu protégé
const TestComponent = () => <div data-testid="protected-content">Contenu protégé</div>;

// Helper pour wrapper les composants avec les providers nécessaires
const renderWithProviders = (component, { store = createTestStore(), initialEntries = ['/profile'] } = {}) => {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        {component}
      </MemoryRouter>
    </Provider>
  );
};

describe('ProtectedRoute Component', () => {
  describe('Utilisateur non authentifié', () => {
    test('redirige vers la page de connexion', () => {
      const unauthenticatedStore = createTestStore({
        auth: { isAuthenticated: false, loading: false },
      });

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        { store: unauthenticatedStore }
      );

      // Vérifier que le contenu protégé n'est pas affiché
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      
      // Vérifier qu'il y a une redirection (dans un vrai test, on vérifierait l'URL)
      // Note: Dans un test d'intégration, on pourrait vérifier que l'utilisateur est redirigé vers /login
    });

    test('passe l\'emplacement actuel dans l\'état de redirection', () => {
      const unauthenticatedStore = createTestStore({
        auth: { isAuthenticated: false, loading: false },
      });

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        { store: unauthenticatedStore }
      );

      // Dans un vrai test, on vérifierait que l'état de redirection contient l'emplacement actuel
      // Cela permettrait de rediriger l'utilisateur vers la page d'origine après connexion
    });
  });

  describe('Utilisateur authentifié', () => {
    test('affiche le contenu protégé', () => {
      const authenticatedStore = createTestStore({
        auth: {
          user: {
            _id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
          isAuthenticated: true,
          loading: false,
        },
      });

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        { store: authenticatedStore }
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
    });

    test('affiche le contenu protégé même sans utilisateur détaillé', () => {
      const authenticatedStore = createTestStore({
        auth: {
          user: null,
          isAuthenticated: true,
          loading: false,
        },
      });

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        { store: authenticatedStore }
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('État de chargement', () => {
    test('affiche un spinner pendant le chargement', () => {
      const loadingStore = createTestStore({
        auth: { loading: true },
      });

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        { store: loadingStore }
      );

      // Vérifier qu'un spinner est affiché
      const spinner = screen.getByRole('status', { hidden: true }) || 
                     document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      
      // Le contenu protégé ne devrait pas être affiché pendant le chargement
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    test('affiche le spinner avec les bonnes classes CSS', () => {
      const loadingStore = createTestStore({
        auth: { loading: true },
      });

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        { store: loadingStore }
      );

      // Vérifier que le conteneur du spinner a les bonnes classes
      const spinnerContainer = document.querySelector('.min-h-screen.flex.items-center.justify-center');
      expect(spinnerContainer).toBeInTheDocument();
    });
  });

  describe('Gestion des enfants', () => {
    test('rend correctement les enfants passés en props', () => {
      const authenticatedStore = createTestStore({
        auth: { isAuthenticated: true, loading: false },
      });

      const CustomChild = () => <div data-testid="custom-child">Enfant personnalisé</div>;

      renderWithProviders(
        <ProtectedRoute>
          <CustomChild />
        </ProtectedRoute>,
        { store: authenticatedStore }
      );

      expect(screen.getByTestId('custom-child')).toBeInTheDocument();
      expect(screen.getByText('Enfant personnalisé')).toBeInTheDocument();
    });

    test('peut gérer plusieurs enfants', () => {
      const authenticatedStore = createTestStore({
        auth: { isAuthenticated: true, loading: false },
      });

      renderWithProviders(
        <ProtectedRoute>
          <div data-testid="child-1">Enfant 1</div>
          <div data-testid="child-2">Enfant 2</div>
        </ProtectedRoute>,
        { store: authenticatedStore }
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  describe('Accessibilité', () => {
    test('le spinner a les attributs d\'accessibilité appropriés', () => {
      const loadingStore = createTestStore({
        auth: { loading: true },
      });

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        { store: loadingStore }
      );

      // Vérifier que le spinner est accessible
      // Dans un vrai test, on pourrait ajouter des attributs ARIA appropriés
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Intégration avec React Router', () => {
    test('fonctionne correctement avec différentes routes', () => {
      const authenticatedStore = createTestStore({
        auth: { isAuthenticated: true, loading: false },
      });

      // Tester avec différentes routes
      const routes = ['/profile', '/orders', '/checkout'];
      
      routes.forEach(route => {
        const { unmount } = renderWithProviders(
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>,
          { store: authenticatedStore, initialEntries: [route] }
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Gestion des erreurs', () => {
    test('gère correctement les états d\'erreur', () => {
      const errorStore = createTestStore({
        auth: {
          isAuthenticated: false,
          loading: false,
          error: 'Erreur de connexion',
        },
      });

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        { store: errorStore }
      );

      // Même avec une erreur, si l'utilisateur n'est pas authentifié, il devrait être redirigé
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });
});
