import authSlice, { login, register, getCurrentUser, updateProfile, changePassword, logout, clearError, setLoading } from '../authSlice';

// Mock pour axios
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
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

describe('authSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('État initial', () => {
    test('a l\'état initial correct', () => {
      const initialState = authSlice(undefined, { type: 'unknown' });
      
      expect(initialState).toEqual({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    });

    test('charge le token depuis localStorage si disponible', () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      
      const initialState = authSlice(undefined, { type: 'unknown' });
      
      expect(initialState.token).toBe('test-token');
    });
  });

  describe('Actions synchrones', () => {
    test('logout réinitialise l\'état et supprime le token', () => {
      const initialState = {
        user: { _id: '1', name: 'John' },
        token: 'test-token',
        isAuthenticated: true,
        isLoading: false,
        error: 'Some error',
      };

      const newState = authSlice(initialState, logout());

      expect(newState).toEqual({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });

    test('clearError supprime l\'erreur', () => {
      const initialState = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Some error',
      };

      const newState = authSlice(initialState, clearError());

      expect(newState.error).toBeNull();
    });

    test('setLoading met à jour l\'état de chargement', () => {
      const initialState = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

      const newState = authSlice(initialState, setLoading(true));

      expect(newState.isLoading).toBe(true);
    });
  });

  describe('Actions asynchrones - Login', () => {
    test('login.pending met isLoading à true et supprime l\'erreur', () => {
      const initialState = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Previous error',
      };

      const newState = authSlice(initialState, login.pending());

      expect(newState.isLoading).toBe(true);
      expect(newState.error).toBeNull();
    });

    test('login.fulfilled met à jour l\'état avec les données utilisateur', () => {
      const initialState = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
      };

      const mockResponse = {
        user: { _id: '1', name: 'John', email: 'john@example.com' },
        token: 'new-token',
      };

      const newState = authSlice(initialState, login.fulfilled(mockResponse));

      expect(newState.isLoading).toBe(false);
      expect(newState.isAuthenticated).toBe(true);
      expect(newState.user).toEqual(mockResponse.user);
      expect(newState.token).toBe(mockResponse.token);
      expect(newState.error).toBeNull();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'new-token');
    });

    test('login.rejected met à jour l\'état avec l\'erreur', () => {
      const initialState = {
        user: { _id: '1', name: 'John' },
        token: 'old-token',
        isAuthenticated: true,
        isLoading: true,
        error: null,
      };

      const errorMessage = 'Invalid credentials';
      const newState = authSlice(initialState, login.rejected(null, null, errorMessage));

      expect(newState.isLoading).toBe(false);
      expect(newState.isAuthenticated).toBe(false);
      expect(newState.user).toBeNull();
      expect(newState.token).toBeNull();
      expect(newState.error).toBe(errorMessage);
    });
  });

  describe('Actions asynchrones - Register', () => {
    test('register.fulfilled met à jour l\'état avec les données utilisateur', () => {
      const initialState = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
      };

      const mockResponse = {
        user: { _id: '1', name: 'Jane', email: 'jane@example.com' },
        token: 'new-token',
      };

      const newState = authSlice(initialState, register.fulfilled(mockResponse));

      expect(newState.isLoading).toBe(false);
      expect(newState.isAuthenticated).toBe(true);
      expect(newState.user).toEqual(mockResponse.user);
      expect(newState.token).toBe(mockResponse.token);
      expect(newState.error).toBeNull();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'new-token');
    });

    test('register.rejected met à jour l\'état avec l\'erreur', () => {
      const initialState = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
      };

      const errorMessage = 'Email already exists';
      const newState = authSlice(initialState, register.rejected(null, null, errorMessage));

      expect(newState.isLoading).toBe(false);
      expect(newState.isAuthenticated).toBe(false);
      expect(newState.user).toBeNull();
      expect(newState.token).toBeNull();
      expect(newState.error).toBe(errorMessage);
    });
  });

  describe('Actions asynchrones - GetCurrentUser', () => {
    test('getCurrentUser.fulfilled met à jour l\'utilisateur sans changer le token', () => {
      const initialState = {
        user: null,
        token: 'existing-token',
        isAuthenticated: false,
        isLoading: true,
        error: null,
      };

      const mockResponse = {
        user: { _id: '1', name: 'John', email: 'john@example.com' },
      };

      const newState = authSlice(initialState, getCurrentUser.fulfilled(mockResponse));

      expect(newState.isLoading).toBe(false);
      expect(newState.isAuthenticated).toBe(true);
      expect(newState.user).toEqual(mockResponse.user);
      expect(newState.token).toBe('existing-token'); // Le token ne change pas
      expect(newState.error).toBeNull();
    });

    test('getCurrentUser.rejected supprime le token invalide', () => {
      const initialState = {
        user: { _id: '1', name: 'John' },
        token: 'invalid-token',
        isAuthenticated: true,
        isLoading: true,
        error: null,
      };

      const errorMessage = 'Token expired';
      const newState = authSlice(initialState, getCurrentUser.rejected(null, null, errorMessage));

      expect(newState.isLoading).toBe(false);
      expect(newState.isAuthenticated).toBe(false);
      expect(newState.user).toBeNull();
      expect(newState.token).toBeNull();
      expect(newState.error).toBe(errorMessage);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('Actions asynchrones - UpdateProfile', () => {
    test('updateProfile.fulfilled met à jour les données utilisateur', () => {
      const initialState = {
        user: { _id: '1', name: 'John', email: 'john@example.com' },
        token: 'token',
        isAuthenticated: true,
        isLoading: true,
        error: null,
      };

      const mockResponse = {
        user: { _id: '1', name: 'John Updated', email: 'john@example.com' },
      };

      const newState = authSlice(initialState, updateProfile.fulfilled(mockResponse));

      expect(newState.isLoading).toBe(false);
      expect(newState.user).toEqual(mockResponse.user);
      expect(newState.error).toBeNull();
      expect(newState.isAuthenticated).toBe(true); // Reste authentifié
    });

    test('updateProfile.rejected met à jour l\'erreur', () => {
      const initialState = {
        user: { _id: '1', name: 'John' },
        token: 'token',
        isAuthenticated: true,
        isLoading: true,
        error: null,
      };

      const errorMessage = 'Update failed';
      const newState = authSlice(initialState, updateProfile.rejected(null, null, errorMessage));

      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBe(errorMessage);
      expect(newState.user).toEqual(initialState.user); // L'utilisateur ne change pas
      expect(newState.isAuthenticated).toBe(true); // Reste authentifié
    });
  });

  describe('Actions asynchrones - ChangePassword', () => {
    test('changePassword.fulfilled met à jour l\'état sans changer l\'utilisateur', () => {
      const initialState = {
        user: { _id: '1', name: 'John' },
        token: 'token',
        isAuthenticated: true,
        isLoading: true,
        error: null,
      };

      const newState = authSlice(initialState, changePassword.fulfilled());

      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBeNull();
      expect(newState.user).toEqual(initialState.user); // L'utilisateur ne change pas
      expect(newState.isAuthenticated).toBe(true); // Reste authentifié
    });

    test('changePassword.rejected met à jour l\'erreur', () => {
      const initialState = {
        user: { _id: '1', name: 'John' },
        token: 'token',
        isAuthenticated: true,
        isLoading: true,
        error: null,
      };

      const errorMessage = 'Current password is incorrect';
      const newState = authSlice(initialState, changePassword.rejected(null, null, errorMessage));

      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBe(errorMessage);
      expect(newState.user).toEqual(initialState.user); // L'utilisateur ne change pas
      expect(newState.isAuthenticated).toBe(true); // Reste authentifié
    });
  });

  describe('Gestion des erreurs', () => {
    test('gère les erreurs de réseau', () => {
      const initialState = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
      };

      const errorMessage = 'Network Error';
      const newState = authSlice(initialState, login.rejected(null, null, errorMessage));

      expect(newState.error).toBe(errorMessage);
      expect(newState.isLoading).toBe(false);
    });

    test('gère les erreurs avec message personnalisé', () => {
      const initialState = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
      };

      const errorMessage = 'Email not found';
      const newState = authSlice(initialState, login.rejected(null, null, errorMessage));

      expect(newState.error).toBe(errorMessage);
    });
  });

  describe('Persistance du token', () => {
    test('sauvegarde le token dans localStorage lors de la connexion', () => {
      const initialState = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
      };

      const mockResponse = {
        user: { _id: '1', name: 'John' },
        token: 'new-token',
      };

      authSlice(initialState, login.fulfilled(mockResponse));

      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'new-token');
    });

    test('supprime le token de localStorage lors de la déconnexion', () => {
      const initialState = {
        user: { _id: '1', name: 'John' },
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

      authSlice(initialState, logout());

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });
  });
});
