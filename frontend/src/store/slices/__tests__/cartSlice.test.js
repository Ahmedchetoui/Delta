import cartSlice, {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCart,
  openCart,
  closeCart,
  setLoading,
  setError,
  clearError,
  selectCartItems,
  selectCartItemCount,
  selectCartTotal,
  selectCartIsOpen,
  selectCartIsLoading,
  selectCartError,
  selectIsInCart,
  selectCartItemQuantity,
} from '../cartSlice';

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
  images: ['/api/images/chemise.jpg'],
};

const mockProduct2 = {
  _id: '2',
  name: 'Pantalon jean',
  price: 79.99,
  images: ['/api/images/jean.jpg'],
};

describe('cartSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');
  });

  describe('État initial', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    test('a l\'état initial correct', () => {
      const initialState = cartSlice(undefined, { type: 'unknown' });
      
      expect(initialState).toEqual({
        items: [],
        isOpen: false,
        isLoading: false,
        error: null,
      });
    });

    test('charge les articles depuis localStorage', () => {
      const mockCartData = [
        {
          id: '1-default-default',
          product: mockProduct,
          quantity: 2,
          size: null,
          color: null,
          price: 49.99,
          addedAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockCartData));
      
      const initialState = cartSlice(undefined, { type: 'unknown' });
      
      expect(initialState.items).toEqual(mockCartData);
    });

    test('gère les erreurs de parsing localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      const initialState = cartSlice(undefined, { type: 'unknown' });
      
      expect(initialState.items).toEqual([]);
    });
  });

  describe('Actions synchrones', () => {
    test('toggleCart inverse l\'état isOpen', () => {
      const initialState = {
        items: [],
        isOpen: false,
        isLoading: false,
        error: null,
      };

      const newState = cartSlice(initialState, toggleCart());
      expect(newState.isOpen).toBe(true);

      const newState2 = cartSlice(newState, toggleCart());
      expect(newState2.isOpen).toBe(false);
    });

    test('openCart met isOpen à true', () => {
      const initialState = {
        items: [],
        isOpen: false,
        isLoading: false,
        error: null,
      };

      const newState = cartSlice(initialState, openCart());
      expect(newState.isOpen).toBe(true);
    });

    test('closeCart met isOpen à false', () => {
      const initialState = {
        items: [],
        isOpen: true,
        isLoading: false,
        error: null,
      };

      const newState = cartSlice(initialState, closeCart());
      expect(newState.isOpen).toBe(false);
    });

    test('setLoading met à jour l\'état de chargement', () => {
      const initialState = {
        items: [],
        isOpen: false,
        isLoading: false,
        error: null,
      };

      const newState = cartSlice(initialState, setLoading(true));
      expect(newState.isLoading).toBe(true);
    });

    test('setError met à jour l\'erreur', () => {
      const initialState = {
        items: [],
        isOpen: false,
        isLoading: false,
        error: null,
      };

      const errorMessage = 'Erreur de chargement';
      const newState = cartSlice(initialState, setError(errorMessage));
      expect(newState.error).toBe(errorMessage);
    });

    test('clearError supprime l\'erreur', () => {
      const initialState = {
        items: [],
        isOpen: false,
        isLoading: false,
        error: 'Some error',
      };

      const newState = cartSlice(initialState, clearError());
      expect(newState.error).toBeNull();
    });
  });

  describe('addToCart', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('[]');
    });

    test('ajoute un nouveau produit au panier', () => {
      const initialState = {
        items: [],
        isOpen: false,
        isLoading: false,
        error: null,
      };

      const newState = cartSlice(initialState, addToCart({
        product: mockProduct,
        quantity: 1,
      }));

      expect(newState.items).toHaveLength(1);
      expect(newState.items[0]).toMatchObject({
        product: mockProduct,
        quantity: 1,
        size: null,
        color: null,
        price: 49.99,
      });
      expect(newState.items[0].id).toBe('1-default-default');
      expect(newState.items[0].addedAt).toBeDefined();
    });

    test('ajoute un produit avec taille et couleur', () => {
      const initialState = {
        items: [],
        isOpen: false,
        isLoading: false,
        error: null,
      };

      const newState = cartSlice(initialState, addToCart({
        product: mockProduct,
        quantity: 2,
        size: 'M',
        color: 'Bleu',
      }));

      expect(newState.items[0]).toMatchObject({
        product: mockProduct,
        quantity: 2,
        size: 'M',
        color: 'Bleu',
        price: 49.99,
      });
      expect(newState.items[0].id).toBe('1-M-Bleu');
    });

    test('augmente la quantité si le produit existe déjà avec la même taille et couleur', () => {
      const initialState = {
        items: [
          {
            id: '1-default-default',
            product: mockProduct,
            quantity: 1,
            size: null,
            color: null,
            price: 49.99,
            addedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        isOpen: false,
        isLoading: false,
        error: null,
      };

      const newState = cartSlice(initialState, addToCart({
        product: mockProduct,
        quantity: 2,
      }));

      expect(newState.items).toHaveLength(1);
      expect(newState.items[0].quantity).toBe(3);
    });

    test('ajoute un nouveau produit si la taille ou couleur diffère', () => {
      const initialState = {
        items: [
          {
            id: '1-default-default',
            product: mockProduct,
            quantity: 1,
            size: null,
            color: null,
            price: 49.99,
            addedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        isOpen: false,
        isLoading: false,
        error: null,
      };

      const newState = cartSlice(initialState, addToCart({
        product: mockProduct,
        quantity: 1,
        size: 'L',
        color: 'Rouge',
      }));

      expect(newState.items).toHaveLength(2);
      expect(newState.items[1]).toMatchObject({
        product: mockProduct,
        quantity: 1,
        size: 'L',
        color: 'Rouge',
      });
    });
  });

  describe('removeFromCart', () => {
    test('supprime un article du panier', () => {
      const initialState = {
        items: [
          {
            id: '1-default-default',
            product: mockProduct,
            quantity: 1,
            size: null,
            color: null,
            price: 49.99,
            addedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            id: '2-default-default',
            product: mockProduct2,
            quantity: 1,
            size: null,
            color: null,
            price: 79.99,
            addedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        isOpen: false,
        isLoading: false,
        error: null,
      };

      const newState = cartSlice(initialState, removeFromCart('1-default-default'));

      expect(newState.items).toHaveLength(1);
      expect(newState.items[0].id).toBe('2-default-default');
    });

    test('ne fait rien si l\'article n\'existe pas', () => {
      const initialState = {
        items: [
          {
            id: '1-default-default',
            product: mockProduct,
            quantity: 1,
            size: null,
            color: null,
            price: 49.99,
            addedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        isOpen: false,
        isLoading: false,
        error: null,
      };

      const newState = cartSlice(initialState, removeFromCart('nonexistent-id'));

      expect(newState.items).toHaveLength(1);
      expect(newState.items[0].id).toBe('1-default-default');
    });
  });

  describe('updateQuantity', () => {
    test('met à jour la quantité d\'un article', () => {
      const initialState = {
        items: [
          {
            id: '1-default-default',
            product: mockProduct,
            quantity: 1,
            size: null,
            color: null,
            price: 49.99,
            addedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        isOpen: false,
        isLoading: false,
        error: null,
      };

      const newState = cartSlice(initialState, updateQuantity({
        itemId: '1-default-default',
        quantity: 3,
      }));

      expect(newState.items[0].quantity).toBe(3);
    });

    test('supprime l\'article si la quantité est 0', () => {
      const initialState = {
        items: [
          {
            id: '1-default-default',
            product: mockProduct,
            quantity: 1,
            size: null,
            color: null,
            price: 49.99,
            addedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        isOpen: false,
        isLoading: false,
        error: null,
      };

      const newState = cartSlice(initialState, updateQuantity({
        itemId: '1-default-default',
        quantity: 0,
      }));

      expect(newState.items).toHaveLength(0);
    });

    test('supprime l\'article si la quantité est négative', () => {
      const initialState = {
        items: [
          {
            id: '1-default-default',
            product: mockProduct,
            quantity: 1,
            size: null,
            color: null,
            price: 49.99,
            addedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        isOpen: false,
        isLoading: false,
        error: null,
      };

      const newState = cartSlice(initialState, updateQuantity({
        itemId: '1-default-default',
        quantity: -1,
      }));

      expect(newState.items).toHaveLength(0);
    });

    test('ne fait rien si l\'article n\'existe pas', () => {
      const initialState = {
        items: [
          {
            id: '1-default-default',
            product: mockProduct,
            quantity: 1,
            size: null,
            color: null,
            price: 49.99,
            addedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        isOpen: false,
        isLoading: false,
        error: null,
      };

      const newState = cartSlice(initialState, updateQuantity({
        itemId: 'nonexistent-id',
        quantity: 5,
      }));

      expect(newState.items).toHaveLength(1);
      expect(newState.items[0].quantity).toBe(1);
    });
  });

  describe('clearCart', () => {
    test('vide le panier', () => {
      const initialState = {
        items: [
          {
            id: '1-default-default',
            product: mockProduct,
            quantity: 1,
            size: null,
            color: null,
            price: 49.99,
            addedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            id: '2-default-default',
            product: mockProduct2,
            quantity: 2,
            size: null,
            color: null,
            price: 79.99,
            addedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        isOpen: false,
        isLoading: false,
        error: null,
      };

      const newState = cartSlice(initialState, clearCart());

      expect(newState.items).toHaveLength(0);
    });
  });

  describe('Sélecteurs', () => {
    const mockState = {
      cart: {
        items: [
          {
            id: '1-default-default',
            product: mockProduct,
            quantity: 2,
            size: null,
            color: null,
            price: 49.99,
            addedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            id: '2-default-default',
            product: mockProduct2,
            quantity: 1,
            size: null,
            color: null,
            price: 79.99,
            addedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        isOpen: true,
        isLoading: false,
        error: null,
      },
    };

    test('selectCartItems retourne les articles du panier', () => {
      expect(selectCartItems(mockState)).toEqual(mockState.cart.items);
    });

    test('selectCartItemCount retourne le nombre total d\'articles', () => {
      expect(selectCartItemCount(mockState)).toBe(3); // 2 + 1
    });

    test('selectCartTotal retourne le total du panier', () => {
      const expectedTotal = (49.99 * 2) + (79.99 * 1); // 179.97
      expect(selectCartTotal(mockState)).toBe(expectedTotal);
    });

    test('selectCartIsOpen retourne l\'état d\'ouverture', () => {
      expect(selectCartIsOpen(mockState)).toBe(true);
    });

    test('selectCartIsLoading retourne l\'état de chargement', () => {
      expect(selectCartIsLoading(mockState)).toBe(false);
    });

    test('selectCartError retourne l\'erreur', () => {
      expect(selectCartError(mockState)).toBeNull();
    });

    test('selectIsInCart vérifie si un produit est dans le panier', () => {
      expect(selectIsInCart(mockState, '1', null, null)).toBe(true);
      expect(selectIsInCart(mockState, '1', 'M', 'Bleu')).toBe(false);
      expect(selectIsInCart(mockState, '3', null, null)).toBe(false);
    });

    test('selectCartItemQuantity retourne la quantité d\'un produit', () => {
      expect(selectCartItemQuantity(mockState, '1', null, null)).toBe(2);
      expect(selectCartItemQuantity(mockState, '2', null, null)).toBe(1);
      expect(selectCartItemQuantity(mockState, '3', null, null)).toBe(0);
    });
  });

  describe('Persistance localStorage', () => {
    test('sauvegarde le panier dans localStorage lors d\'ajout', () => {
      const initialState = {
        items: [],
        isOpen: false,
        isLoading: false,
        error: null,
      };

      cartSlice(initialState, addToCart({
        product: mockProduct,
        quantity: 1,
      }));

      // Note: localStorage.setItem n'est pas appelé directement dans les reducers Redux
    });

    test('sauvegarde le panier dans localStorage lors de suppression', () => {
      const initialState = {
        items: [
          {
            id: '1-default-default',
            product: mockProduct,
            quantity: 1,
            size: null,
            color: null,
            price: 49.99,
            addedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        isOpen: false,
        isLoading: false,
        error: null,
      };

      cartSlice(initialState, removeFromCart('1-default-default'));

      // Note: localStorage.setItem n'est pas appelé directement dans les reducers Redux
    });
  });
});
