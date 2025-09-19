// Mock pour axios avant l'import
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Login from '../Login';
import authSlice from '../../store/slices/authSlice';

// Mock pour useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
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

// Helper pour wrapper les composants avec les providers nécessaires
const renderWithProviders = (component, { store = createTestStore() } = {}) => {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </Provider>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu de base', () => {
    test('affiche le formulaire de connexion', async () => {
      await act(async () => {
        renderWithProviders(<Login />);
      });

      expect(screen.getByText('Connexion')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
    });

    test('affiche le lien vers l\'inscription', async () => {
      await act(async () => {
        renderWithProviders(<Login />);
      });

      expect(screen.getByText('Pas encore de compte ?')).toBeInTheDocument();
      expect(screen.getByText('S\'inscrire')).toBeInTheDocument();
    });
  });

  describe('Interactions utilisateur', () => {
    test('permet de saisir l\'email et le mot de passe', async () => {
      await act(async () => {
        renderWithProviders(<Login />);
      });

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Mot de passe');

      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
      });

      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('password123');
    });

    test('affiche les erreurs de validation', async () => {
      await act(async () => {
        renderWithProviders(<Login />);
      });

      const submitButton = screen.getByRole('button', { name: 'Se connecter' });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Vérifier que les messages d'erreur s'affichent
      await waitFor(() => {
        expect(screen.getByText('L\'email est requis')).toBeInTheDocument();
        expect(screen.getByText('Le mot de passe est requis')).toBeInTheDocument();
      });
    });
  });

  describe('États de chargement', () => {
    test('affiche le bouton de chargement pendant la connexion', async () => {
      const store = createTestStore({
        auth: {
          loading: true,
        },
      });

      await act(async () => {
        renderWithProviders(<Login />, { store });
      });

      expect(screen.getByText('Connexion...')).toBeInTheDocument();
    });
  });

  describe('Gestion des erreurs', () => {
    test('affiche les erreurs d\'authentification', async () => {
      const store = createTestStore({
        auth: {
          error: 'Email ou mot de passe incorrect',
        },
      });

      await act(async () => {
        renderWithProviders(<Login />, { store });
      });

      expect(screen.getByText('Email ou mot de passe incorrect')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('navigue vers l\'inscription', async () => {
      await act(async () => {
        renderWithProviders(<Login />);
      });

      const registerLink = screen.getByText('S\'inscrire');
      
      await act(async () => {
        fireEvent.click(registerLink);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });
  });
});