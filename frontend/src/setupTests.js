// setupTests.js
import '@testing-library/jest-dom';

// Mock pour les modules qui peuvent causer des problèmes dans les tests
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  }),
}));

// Mock pour les notifications toast
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
  ToastContainer: () => <div data-testid="toast-container" />,
}));

// Mock pour les appels API
global.fetch = jest.fn();

// Configuration pour les tests
beforeEach(() => {
  fetch.mockClear();
});

afterEach(() => {
  jest.clearAllMocks();
});
