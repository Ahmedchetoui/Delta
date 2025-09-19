import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import ProductCard from '../ProductCard';
import cartSlice from '../../../store/slices/cartSlice';

// Mock pour les icônes Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  HeartIcon: () => <div data-testid="heart-outline-icon" />,
  ShoppingCartIcon: () => <div data-testid="shopping-cart-icon" />,
}));

jest.mock('@heroicons/react/24/solid', () => ({
  HeartIcon: () => <div data-testid="heart-solid-icon" />,
}));

// Mock pour react-toastify
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
};

jest.mock('react-toastify', () => ({
  toast: mockToast,
}));

// Helper pour créer un store de test
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      cart: cartSlice,
    },
    preloadedState: {
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

// Données de test pour un produit
const mockProduct = {
  _id: '1',
  name: 'Chemise en coton bleue',
  price: 89.99,
  finalPrice: 69.99,
  images: ['/api/images/chemise-bleue.jpg'],
  rating: 4.5,
  reviews: [
    { _id: '1', rating: 5 },
    { _id: '2', rating: 4 },
    { _id: '3', rating: 4 },
    { _id: '4', rating: 5 },
    { _id: '5', rating: 4 },
  ],
  totalStock: 15,
  isNew: true,
  isOnSale: true,
  isFeatured: false,
};

const mockProductWithoutSale = {
  ...mockProduct,
  price: 69.99,
  finalPrice: 69.99,
  isOnSale: false,
  isNew: false,
  isFeatured: true,
};

const mockProductOutOfStock = {
  ...mockProduct,
  totalStock: 0,
};

describe('ProductCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu de base', () => {
    test('affiche le nom du produit', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      expect(screen.getByText('Chemise en coton bleue')).toBeInTheDocument();
    });

    test('affiche l\'image du produit', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      const image = screen.getByAltText('Chemise en coton bleue');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/api/images/chemise-bleue.jpg');
    });

    test('affiche le prix du produit', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      expect(screen.getByText('69.99 DT')).toBeInTheDocument();
    });

    test('affiche le prix barré pour les produits en promotion', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      expect(screen.getByText('89.99 DT')).toBeInTheDocument();
    });

    test('affiche le pourcentage de réduction', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      expect(screen.getByText('-22%')).toBeInTheDocument();
    });
  });

  describe('Badges et statuts', () => {
    test('affiche le badge "Nouveau" pour les nouveaux produits', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      expect(screen.getByText('Nouveau')).toBeInTheDocument();
    });

    test('affiche le badge "Vedette" pour les produits vedettes', () => {
      renderWithProviders(<ProductCard product={mockProductWithoutSale} />);
      expect(screen.getByText('Vedette')).toBeInTheDocument();
    });

    test('affiche le statut "En stock"', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      expect(screen.getByText('En stock')).toBeInTheDocument();
    });

    test('affiche le statut "Rupture" pour les produits en rupture', () => {
      renderWithProviders(<ProductCard product={mockProductOutOfStock} />);
      expect(screen.getByText('Rupture')).toBeInTheDocument();
    });
  });

  describe('Évaluation et avis', () => {
    test('affiche les étoiles de notation', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      // Vérifier qu'il y a 5 étoiles
      const stars = screen.getAllByRole('img', { hidden: true });
      expect(stars).toHaveLength(5);
    });

    test('affiche le nombre d\'avis', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      expect(screen.getByText('(5)')).toBeInTheDocument();
    });

    test('affiche (0) quand il n\'y a pas d\'avis', () => {
      const productWithoutReviews = { ...mockProduct, reviews: [] };
      renderWithProviders(<ProductCard product={productWithoutReviews} />);
      expect(screen.getByText('(0)')).toBeInTheDocument();
    });
  });

  describe('Liens et navigation', () => {
    test('le produit est cliquable et mène à la page produit', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      const productLink = screen.getByText('Chemise en coton bleue').closest('a');
      expect(productLink).toHaveAttribute('href', '/product/1');
    });

    test('l\'image est cliquable', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      const imageLink = screen.getByAltText('Chemise en coton bleue').closest('a');
      expect(imageLink).toHaveAttribute('href', '/product/1');
    });
  });

  describe('Boutons d\'action', () => {
    test('affiche les boutons d\'action au survol', async () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      const productCard = screen.getByText('Chemise en coton bleue').closest('div');
      
      fireEvent.mouseEnter(productCard);
      
      await waitFor(() => {
        expect(screen.getByTestId('heart-outline-icon')).toBeInTheDocument();
        expect(screen.getByTestId('shopping-cart-icon')).toBeInTheDocument();
      });
    });

    test('ajoute le produit au panier au clic sur l\'icône panier', async () => {
      const store = createTestStore();
      renderWithProviders(<ProductCard product={mockProduct} />, { store });
      
      const productCard = screen.getByText('Chemise en coton bleue').closest('div');
      fireEvent.mouseEnter(productCard);
      
      await waitFor(() => {
        const cartButton = screen.getByTestId('shopping-cart-icon').closest('button');
        fireEvent.click(cartButton);
      });
      
      expect(mockToast.success).toHaveBeenCalledWith('Produit ajouté au panier !');
    });

    test('affiche un message pour la wishlist au clic sur l\'icône cœur', async () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      
      const productCard = screen.getByText('Chemise en coton bleue').closest('div');
      fireEvent.mouseEnter(productCard);
      
      await waitFor(() => {
        const wishlistButton = screen.getByTestId('heart-outline-icon').closest('button');
        fireEvent.click(wishlistButton);
      });
      
      expect(mockToast.info).toHaveBeenCalledWith('Fonctionnalité wishlist à venir !');
    });
  });

  describe('Gestion des images', () => {
    test('utilise une image par défaut si aucune image n\'est fournie', () => {
      const productWithoutImage = { ...mockProduct, images: [] };
      renderWithProviders(<ProductCard product={productWithoutImage} />);
      
      const image = screen.getByAltText('Chemise en coton bleue');
      expect(image).toHaveAttribute('src', '/api/placeholder/300/300');
    });

    test('utilise la première image du tableau d\'images', () => {
      const productWithMultipleImages = {
        ...mockProduct,
        images: ['/api/images/image1.jpg', '/api/images/image2.jpg'],
      };
      renderWithProviders(<ProductCard product={productWithMultipleImages} />);
      
      const image = screen.getByAltText('Chemise en coton bleue');
      expect(image).toHaveAttribute('src', '/api/images/image1.jpg');
    });
  });

  describe('Calculs de prix', () => {
    test('calcule correctement le pourcentage de réduction', () => {
      const productWithCustomDiscount = {
        ...mockProduct,
        price: 100,
        finalPrice: 75,
      };
      renderWithProviders(<ProductCard product={productWithCustomDiscount} />);
      expect(screen.getByText('-25%')).toBeInTheDocument();
    });

    test('n\'affiche pas le prix barré si pas de promotion', () => {
      renderWithProviders(<ProductCard product={mockProductWithoutSale} />);
      expect(screen.queryByText('69.99 DT')).toBeInTheDocument();
      // Le prix ne devrait pas être barré
      const priceElements = screen.getAllByText('69.99 DT');
      expect(priceElements).toHaveLength(1);
    });
  });

  describe('Accessibilité', () => {
    test('l\'image a un texte alternatif approprié', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      const image = screen.getByAltText('Chemise en coton bleue');
      expect(image).toBeInTheDocument();
    });

    test('les boutons ont des rôles appropriés', async () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      const productCard = screen.getByText('Chemise en coton bleue').closest('div');
      fireEvent.mouseEnter(productCard);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(2); // Wishlist et Add to Cart
      });
    });
  });

  describe('États de stock', () => {
    test('affiche "En stock" en vert pour les produits disponibles', () => {
      renderWithProviders(<ProductCard product={mockProduct} />);
      const stockStatus = screen.getByText('En stock');
      expect(stockStatus).toHaveClass('text-green-600');
    });

    test('affiche "Rupture" en rouge pour les produits en rupture', () => {
      renderWithProviders(<ProductCard product={mockProductOutOfStock} />);
      const stockStatus = screen.getByText('Rupture');
      expect(stockStatus).toHaveClass('text-red-600');
    });
  });
});
