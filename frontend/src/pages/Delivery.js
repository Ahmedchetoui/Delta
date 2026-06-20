import React from 'react';
import { TruckIcon, ClockIcon, ShieldCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { TUNISIA_GOVERNORATES } from '../constants/tunisiaGovernorates';

const Delivery = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Livraison & Retours
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez nos options de livraison et notre politique de retours
          </p>
        </div>

        {/* Delivery Options */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Options de Livraison
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <TruckIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Livraison Standard
              </h3>
              <p className="text-gray-600 mb-4">
                Livraison en 2-3 jours ouvrés dans toute la Tunisie
              </p>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                Gratuite dès 100 DT
              </div>
              <div className="text-sm text-gray-500">
                Sinon 8 DT
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-8 text-center border-2 border-blue-600">
              <ClockIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Livraison Express
              </h3>
              <p className="text-gray-600 mb-4">
                Livraison en 24h pour Tunis et banlieue
              </p>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                8 DT
              </div>
              <div className="text-sm text-gray-500">
                Disponible 7j/7
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <ArrowPathIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Possibilité d&apos;échange
              </h3>
              <p className="text-gray-600 mb-4">
                Échangez votre article contre une autre taille ou couleur selon disponibilité
              </p>
              <div className="text-sm text-gray-500">
                Contactez-nous dans les 14 jours suivant la réception
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Process */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Processus de Livraison
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Commande', description: 'Passez votre commande en ligne' },
              { step: '2', title: 'Préparation', description: 'Nous préparons votre colis' },
              { step: '3', title: 'Expédition', description: 'Votre colis est expédié' },
              { step: '4', title: 'Livraison', description: 'Réception de votre commande' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Return Policy */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Politique de Retours
          </h2>
          
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Conditions de Retour
                </h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>14 jours pour retourner un article</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Article non porté et avec étiquettes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Emballage d'origine intact</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Bon de retour inclus</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Processus de Retour
                </h3>
                <ol className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">1</span>
                    <span>Contactez notre service client</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">2</span>
                    <span>Recevez votre bon de retour</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">3</span>
                    <span>Renvoyez l'article</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">4</span>
                    <span>Remboursement sous 5 jours</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Coverage Areas */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Zones de Livraison
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Nous livrons dans toute la Tunisie — 24 gouvernorats.
          </p>

          <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-3 text-gray-700">
              {TUNISIA_GOVERNORATES.map((governorate) => (
                <li key={governorate} className="flex items-center gap-2">
                  <span className="text-blue-600">•</span>
                  <span>{governorate}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact for Delivery */}
        <div className="bg-blue-600 rounded-lg p-8 text-white text-center">
          <ShieldCheckIcon className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">
            Besoin d'aide avec votre livraison ?
          </h2>
          <p className="text-blue-100 mb-6">
            Notre équipe logistique est là pour vous accompagner
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+216XXXXXXXX"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              📞 Appeler maintenant
            </a>
            <a
              href="/contact"
              className="bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium"
            >
              💬 Nous contacter
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Delivery;
