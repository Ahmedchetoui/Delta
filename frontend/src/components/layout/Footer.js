import React from 'react';
import { Link } from 'react-router-dom';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon, 
  ShareIcon, 
  HeartIcon, 
  StarIcon 
} from '@heroicons/react/24/outline';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="w-full px-6 sm:px-8 lg:px-12 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 justify-items-start">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold text-blue-400 mb-4">
              Delta Fashion
            </h3>
            <p className="text-gray-300 mb-4">
              Votre boutique de mode en ligne pour tous vos besoins vestimentaires. 
              Qualité, style et prix imbattables.
            </p>
            <div className="flex space-x-4 mt-6">
              <button type="button" className="text-gray-400 hover:text-white transition-colors" aria-label="Partager">
                <ShareIcon className="h-6 w-6" />
              </button>
              <button type="button" className="text-gray-400 hover:text-white transition-colors" aria-label="Favori">
                <HeartIcon className="h-6 w-6" />
              </button>
              <button type="button" className="text-gray-400 hover:text-white transition-colors" aria-label="Étoile">
                <StarIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Navigation</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-gray-300 hover:text-white transition-colors">
                  Boutique
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/delivery" className="text-gray-300 hover:text-white transition-colors">
                  Livraison
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Service Client</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/guest-order-tracking" className="text-gray-300 hover:text-white transition-colors">
                  Suivi de commande
                </Link>
              </li>
              <li><span className="text-gray-400">Retours & Échanges</span></li>
              <li><span className="text-gray-400">FAQ</span></li>
              <li><span className="text-gray-400">Guide des tailles</span></li>
              <li><span className="text-gray-400">Conditions d'utilisation</span></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <PhoneIcon className="h-5 w-5 text-blue-400" />
                <span className="text-gray-300">+216 XX XXX XXX</span>
              </div>
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="h-5 w-5 text-blue-400" />
                <span className="text-gray-300">contact@deltafashion.tn</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPinIcon className="h-5 w-5 text-blue-400 mt-1" />
                <span className="text-gray-300">
                  Tunis, Tunisie<br />
                  Avenue Habib Bourguiba
                </span>
              </div>
            </div>
            
            {/* Newsletter */}
            <div className="mt-8 w-full">
              <h5 className="text-sm font-semibold mb-2">Newsletter</h5>
              <p className="text-gray-300 text-sm mb-3">
                Recevez nos dernières offres et nouveautés
              </p>
              <div className="grid grid-cols-[1fr_auto] w-full">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                />
                <button className="px-5 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors">
                  S'abonner
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-3 py-2">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Delta Fashion. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-0 md:mt-0 text-gray-400 text-sm">
              <span>Politique de confidentialité</span>
              <span>Conditions générales</span>
              <span>Mentions légales</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
