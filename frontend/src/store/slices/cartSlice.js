import { createSlice } from '@reduxjs/toolkit';

// Fonction pour charger le panier depuis localStorage
const loadCartFromStorage = () => {
  try {
    const cartData = localStorage.getItem('cart');
    return cartData ? JSON.parse(cartData) : [];
  } catch (error) {
    console.error('Erreur lors du chargement du panier:', error);
    return [];
  }
};

// Fonction pour sauvegarder le panier dans localStorage
const saveCartToStorage = (cart) => {
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du panier:', error);
  }
};

const initialState = {
  items: loadCartFromStorage(),
  isOpen: false,
  isLoading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1, size, color } = action.payload;
      
      // Vérifier si le produit existe déjà dans le panier avec la même taille et couleur
      const existingItemIndex = state.items.findIndex(
        item => 
          item.product._id === product._id && 
          item.size === size && 
          item.color === color
      );
      
      if (existingItemIndex >= 0) {
        // Augmenter la quantité
        state.items[existingItemIndex].quantity += quantity;
      } else {
        // Ajouter un nouvel article
        state.items.push({
          id: `${product._id}-${size || 'default'}-${color || 'default'}`,
          product,
          quantity,
          size: size || null,
          color: color || null,
          price: product.price,
          addedAt: new Date().toISOString(),
        });
      }
      
      saveCartToStorage(state.items);
    },
    
    removeFromCart: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
      saveCartToStorage(state.items);
    },
    
    updateQuantity: (state, action) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find(item => item.id === itemId);
      
      if (item) {
        if (quantity <= 0) {
          // Supprimer l'article si la quantité est 0 ou négative
          state.items = state.items.filter(item => item.id !== itemId);
        } else {
          item.quantity = quantity;
        }
        saveCartToStorage(state.items);
      }
    },
    
    clearCart: (state) => {
      state.items = [];
      saveCartToStorage(state.items);
    },
    
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    
    openCart: (state) => {
      state.isOpen = true;
    },
    
    closeCart: (state) => {
      state.isOpen = false;
    },
    
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
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
} = cartSlice.actions;

// Export de l'ancienne fonction pour compatibilité
export const updateCartItemQuantity = updateQuantity;

// Sélecteurs
export const selectCartItems = (state) => state.cart.items;
export const selectCartItemCount = (state) => 
  state.cart.items.reduce((total, item) => total + item.quantity, 0);
export const selectCartTotal = (state) => 
  state.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
export const selectCartIsOpen = (state) => state.cart.isOpen;
export const selectCartIsLoading = (state) => state.cart.isLoading;
export const selectCartError = (state) => state.cart.error;

// Fonction utilitaire pour vérifier si un produit est dans le panier
export const selectIsInCart = (state, productId, size, color) => {
  return state.cart.items.some(
    item => 
      item.product._id === productId && 
      item.size === size && 
      item.color === color
  );
};

// Fonction utilitaire pour obtenir la quantité d'un produit dans le panier
export const selectCartItemQuantity = (state, productId, size, color) => {
  const item = state.cart.items.find(
    item => 
      item.product._id === productId && 
      item.size === size && 
      item.color === color
  );
  return item ? item.quantity : 0;
};

export default cartSlice.reducer;
