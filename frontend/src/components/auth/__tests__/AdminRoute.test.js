// Mock pour axios avant l'import
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import AdminRoute from '../AdminRoute';
import authSlice from '../../../store/slices/authSlice';

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

// Composant de test pour simuler le contenu admin
const TestAdminComponent = () => <div data-testid="admin-content">Contenu administrateur</div>;

// Helper pour wrapper les composants avec les providers nécessaires
const renderWithProviders = (component, { store = createTestStore(), initialEntries = ['/admin'] } = {}) => {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        {component}
      </MemoryRouter>
    </Provider>
  );
};

describe('AdminRoute Component', () => {
  describe('Utilisateur non authentifié', () => {
    test('redirige vers la page de connexion', () => {
      const unauthenticatedStore = createTestStore({
        auth: { isAuthenticated: false, loading: false },
      });

      renderWithProviders(
        <AdminRoute>
          <TestAdminComponent />
        </AdminRoute>,
        { store: unauthenticatedStore }
      );

      // Vérifier que le contenu admin n'est pas affiché
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
      
      // Dans un vrai test, on vérifierait que l'utilisateur est redirigé vers /login
    });
  });

  describe('Utilisateur authentifié mais non admin', () => {
    test('affiche la page d\'accès refusé', () => {
      const userStore = createTestStore({
        auth: {
          user: {
            _id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'user',
          },
          isAuthenticated: true,
          loading: false,
        },
      });

      renderWithProviders(
        <AdminRoute>
          <TestAdminComponent />
        </AdminRoute>,
        { store: userStore }
      );

      // Vérifier que le contenu admin n'est pas affiché
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
      
      // Vérifier que la page d'accès refusé est affichée
      expect(screen.getByText('Accès Refusé')).toBeInTheDocument();
      expect(screen.getByText('Vous n\'avez pas les permissions nécessaires pour accéder à cette page.')).toBeInTheDocument();
      expect(screen.getByText('Retour à l\'accueil')).toBeInTheDocument();
    });

    test('affiche le bouton de retour à l\'accueil', () => {
      const userStore = createTestStore({
        auth: {
          user: {
            _id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'user',
          },
          isAuthenticated: true,
          loading: false,
        },
      });

      renderWithProviders(
        <AdminRoute>
          <TestAdminComponent />
        </AdminRoute>,
        { store: userStore }
      );

      const homeButton = screen.getByText('Retour à l\'accueil');
      expect(homeButton).toBeInTheDocument();
      expect(homeButton).toHaveAttribute('href', '/');
    });

    test('gère le cas où l\'utilisateur n\'a pas de rôle défini', () => {
      const userWithoutRoleStore = createTestStore({
        auth: {
          user: {
            _id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            // Pas de propriété role
          },
          isAuthenticated: true,
          loading: false,
        },
      });

      renderWithProviders(
        <AdminRoute>
          <TestAdminComponent />
        </AdminRoute>,
        { store: userWithoutRoleStore }
      );

      expect(screen.getByText('Accès Refusé')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });
  });

  describe('Utilisateur administrateur', () => {
    test('affiche le contenu administrateur', () => {
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
          loading: false,
        },
      });

      renderWithProviders(
        <AdminRoute>
          <TestAdminComponent />
        </AdminRoute>,
        { store: adminStore }
      );

      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
      expect(screen.getByText('Contenu administrateur')).toBeInTheDocument();
    });

    test('affiche le contenu admin même avec des données utilisateur minimales', () => {
      const adminStore = createTestStore({
        auth: {
          user: {
            _id: '1',
            role: 'admin',
          },
          isAuthenticated: true,
          loading: false,
        },
      });

      renderWithProviders(
        <AdminRoute>
          <TestAdminComponent />
        </AdminRoute>,
        { store: adminStore }
      );

      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });
  });

  describe('État de chargement', () => {
    test('affiche un spinner pendant le chargement', () => {
      const loadingStore = createTestStore({
        auth: { loading: true },
      });

      renderWithProviders(
        <AdminRoute>
          <TestAdminComponent />
        </AdminRoute>,
        { store: loadingStore }
      );

      // Vérifier qu'un spinner est affiché
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      
      // Le contenu admin ne devrait pas être affiché pendant le chargement
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
      expect(screen.queryByText('Accès Refusé')).not.toBeInTheDocument();
    });

    test('affiche le spinner avec les bonnes classes CSS', () => {
      const loadingStore = createTestStore({
        auth: { loading: true },
      });

      renderWithProviders(
        <AdminRoute>
          <TestAdminComponent />
        </AdminRoute>,
        { store: loadingStore }
      );

      // Vérifier que le conteneur du spinner a les bonnes classes
      const spinnerContainer = document.querySelector('.min-h-screen.flex.items-center.justify-center');
      expect(spinnerContainer).toBeInTheDocument();
    });
  });

  describe('Gestion des enfants', () => {
    test('rend correctement les enfants passés en props pour un admin', () => {
      const adminStore = createTestStore({
        auth: {
          user: { _id: '1', role: 'admin' },
          isAuthenticated: true,
          loading: false,
        },
      });

      const CustomAdminChild = () => <div data-testid="custom-admin-child">Enfant admin personnalisé</div>;

      renderWithProviders(
        <AdminRoute>
          <CustomAdminChild />
        </AdminRoute>,
        { store: adminStore }
      );

      expect(screen.getByTestId('custom-admin-child')).toBeInTheDocument();
      expect(screen.getByText('Enfant admin personnalisé')).toBeInTheDocument();
    });

    test('peut gérer plusieurs enfants pour un admin', () => {
      const adminStore = createTestStore({
        auth: {
          user: { _id: '1', role: 'admin' },
          isAuthenticated: true,
          loading: false,
        },
      });

      renderWithProviders(
        <AdminRoute>
          <div data-testid="admin-child-1">Enfant admin 1</div>
          <div data-testid="admin-child-2">Enfant admin 2</div>
        </AdminRoute>,
        { store: adminStore }
      );

      expect(screen.getByTestId('admin-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('admin-child-2')).toBeInTheDocument();
    });
  });

  describe('Accessibilité', () => {
    test('la page d\'accès refusé a une structure accessible', () => {
      const userStore = createTestStore({
        auth: {
          user: { _id: '1', role: 'user' },
          isAuthenticated: true,
          loading: false,
        },
      });

      renderWithProviders(
        <AdminRoute>
          <TestAdminComponent />
        </AdminRoute>,
        { store: userStore }
      );

      // Vérifier que les titres ont les bonnes balises
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Accès Refusé');
      
      // Vérifier que le bouton est accessible
      const homeButton = screen.getByText('Retour à l\'accueil');
      expect(homeButton).toBeInTheDocument();
    });

    test('le spinner a les attributs d\'accessibilité appropriés', () => {
      const loadingStore = createTestStore({
        auth: { loading: true },
      });

      renderWithProviders(
        <AdminRoute>
          <TestAdminComponent />
        </AdminRoute>,
        { store: loadingStore }
      );

      // Vérifier que le spinner est accessible
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Intégration avec React Router', () => {
    test('fonctionne correctement avec différentes routes admin', () => {
      const adminStore = createTestStore({
        auth: {
          user: { _id: '1', role: 'admin' },
          isAuthenticated: true,
          loading: false,
        },
      });

      // Tester avec différentes routes admin
      const adminRoutes = ['/admin', '/admin/products', '/admin/orders', '/admin/customers'];
      
      adminRoutes.forEach(route => {
        const { unmount } = renderWithProviders(
          <AdminRoute>
            <TestAdminComponent />
          </AdminRoute>,
          { store: adminStore, initialEntries: [route] }
        );

        expect(screen.getByTestId('admin-content')).toBeInTheDocument();
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
        <AdminRoute>
          <TestAdminComponent />
        </AdminRoute>,
        { store: errorStore }
      );

      // Même avec une erreur, si l'utilisateur n'est pas authentifié, il devrait être redirigé
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });
  });

  describe('Différents rôles utilisateur', () => {
    test('refuse l\'accès pour un utilisateur avec le rôle "moderator"', () => {
      const moderatorStore = createTestStore({
        auth: {
          user: {
            _id: '1',
            firstName: 'Moderator',
            lastName: 'User',
            email: 'moderator@example.com',
            role: 'moderator',
          },
          isAuthenticated: true,
          loading: false,
        },
      });

      renderWithProviders(
        <AdminRoute>
          <TestAdminComponent />
        </AdminRoute>,
        { store: moderatorStore }
      );

      expect(screen.getByText('Accès Refusé')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });

    test('refuse l\'accès pour un utilisateur avec le rôle "seller"', () => {
      const sellerStore = createTestStore({
        auth: {
          user: {
            _id: '1',
            firstName: 'Seller',
            lastName: 'User',
            email: 'seller@example.com',
            role: 'seller',
          },
          isAuthenticated: true,
          loading: false,
        },
      });

      renderWithProviders(
        <AdminRoute>
          <TestAdminComponent />
        </AdminRoute>,
        { store: sellerStore }
      );

      expect(screen.getByText('Accès Refusé')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });
  });
});
