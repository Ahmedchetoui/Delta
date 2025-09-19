import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from '../Footer';

// Mock pour les icônes Heroicons qui ne sont pas disponibles dans la version installée
jest.mock('@heroicons/react/24/outline', () => ({
  EnvelopeIcon: () => <div data-testid="envelope-icon" />,
  PhoneIcon: () => <div data-testid="phone-icon" />,
  MapPinIcon: () => <div data-testid="map-pin-icon" />,
  FacebookIcon: () => <div data-testid="facebook-icon" />,
  InstagramIcon: () => <div data-testid="instagram-icon" />,
  TwitterIcon: () => <div data-testid="twitter-icon" />,
}));

// Helper pour wrapper le composant avec BrowserRouter
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Footer Component', () => {
  describe('Rendu de base', () => {
    test('affiche le logo et la description de l\'entreprise', () => {
      renderWithRouter(<Footer />);
      
      expect(screen.getByText('Delta Fashion')).toBeInTheDocument();
      expect(screen.getByText(/Votre boutique de mode en ligne/)).toBeInTheDocument();
    });

    test('affiche les liens de navigation principaux', () => {
      renderWithRouter(<Footer />);
      
      expect(screen.getByText('Liens Rapides')).toBeInTheDocument();
      expect(screen.getByText('Accueil')).toBeInTheDocument();
      expect(screen.getByText('Boutique')).toBeInTheDocument();
      expect(screen.getByText('À propos')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Livraison')).toBeInTheDocument();
    });

    test('affiche les informations de service client', () => {
      renderWithRouter(<Footer />);
      
      expect(screen.getByText('Service Client')).toBeInTheDocument();
      expect(screen.getByText('Suivi de commande')).toBeInTheDocument();
      expect(screen.getByText('Retours & Échanges')).toBeInTheDocument();
      expect(screen.getByText('FAQ')).toBeInTheDocument();
      expect(screen.getByText('Guide des tailles')).toBeInTheDocument();
      expect(screen.getByText('Conditions d\'utilisation')).toBeInTheDocument();
    });

    test('affiche les informations de contact', () => {
      renderWithRouter(<Footer />);
      
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('+216 XX XXX XXX')).toBeInTheDocument();
      expect(screen.getByText('contact@deltafashion.tn')).toBeInTheDocument();
      expect(screen.getByText('Tunis, Tunisie')).toBeInTheDocument();
      expect(screen.getByText('Avenue Habib Bourguiba')).toBeInTheDocument();
    });
  });

  describe('Icônes et éléments visuels', () => {
    test('affiche toutes les icônes de contact', () => {
      renderWithRouter(<Footer />);
      
      expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
      expect(screen.getByTestId('envelope-icon')).toBeInTheDocument();
      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument();
    });

    test('affiche les icônes des réseaux sociaux', () => {
      renderWithRouter(<Footer />);
      
      expect(screen.getByTestId('facebook-icon')).toBeInTheDocument();
      expect(screen.getByTestId('instagram-icon')).toBeInTheDocument();
      expect(screen.getByTestId('twitter-icon')).toBeInTheDocument();
    });
  });

  describe('Newsletter', () => {
    test('affiche la section newsletter', () => {
      renderWithRouter(<Footer />);
      
      expect(screen.getByText('Newsletter')).toBeInTheDocument();
      expect(screen.getByText('Recevez nos dernières offres et nouveautés')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Votre email')).toBeInTheDocument();
      expect(screen.getByText('S\'abonner')).toBeInTheDocument();
    });

    test('permet de saisir un email dans le champ newsletter', () => {
      renderWithRouter(<Footer />);
      const emailInput = screen.getByPlaceholderText('Votre email');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(emailInput.value).toBe('test@example.com');
    });
  });

  describe('Liens de navigation', () => {
    test('tous les liens internes pointent vers les bonnes routes', () => {
      renderWithRouter(<Footer />);
      
      const accueilLink = screen.getByText('Accueil').closest('a');
      const boutiqueLink = screen.getByText('Boutique').closest('a');
      const aboutLink = screen.getByText('À propos').closest('a');
      const contactLink = screen.getByText('Contact').closest('a');
      const deliveryLink = screen.getByText('Livraison').closest('a');
      const trackingLink = screen.getByText('Suivi de commande').closest('a');
      
      expect(accueilLink).toHaveAttribute('href', '/');
      expect(boutiqueLink).toHaveAttribute('href', '/shop');
      expect(aboutLink).toHaveAttribute('href', '/about');
      expect(contactLink).toHaveAttribute('href', '/contact');
      expect(deliveryLink).toHaveAttribute('href', '/delivery');
      expect(trackingLink).toHaveAttribute('href', '/order-tracking');
    });
  });

  describe('Copyright et mentions légales', () => {
    test('affiche le copyright', () => {
      renderWithRouter(<Footer />);
      expect(screen.getByText('© 2024 Delta Fashion. Tous droits réservés.')).toBeInTheDocument();
    });

    test('affiche les liens des mentions légales', () => {
      renderWithRouter(<Footer />);
      
      expect(screen.getByText('Politique de confidentialité')).toBeInTheDocument();
      expect(screen.getByText('Conditions générales')).toBeInTheDocument();
      expect(screen.getByText('Mentions légales')).toBeInTheDocument();
    });
  });

  describe('Structure responsive', () => {
    test('utilise les classes CSS appropriées pour la grille responsive', () => {
      renderWithRouter(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('bg-gray-900', 'text-white');
      
      // Vérifier la structure de la grille
      const gridContainer = footer.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
    });
  });

  describe('Accessibilité', () => {
    test('a un élément footer avec le rôle approprié', () => {
      renderWithRouter(<Footer />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    test('les liens ont des textes descriptifs', () => {
      renderWithRouter(<Footer />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveTextContent();
      });
    });

    test('le champ email a le bon type et placeholder', () => {
      renderWithRouter(<Footer />);
      const emailInput = screen.getByPlaceholderText('Votre email');
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'Votre email');
    });
  });
});
