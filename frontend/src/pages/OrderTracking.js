import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon, TruckIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const OrderTracking = () => {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [trackingResult, setTrackingResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    setLoading(true);
    // TODO: Implémenter la recherche de commande
    setTimeout(() => {
      setTrackingResult({
        orderNumber: orderNumber,
        status: 'shipped',
        estimatedDelivery: '2024-01-15',
        trackingNumber: 'TN123456789',
        items: [
          { name: 'T-shirt Delta Fashion', quantity: 2, price: 45.00 },
          { name: 'Jean Slim', quantity: 1, price: 89.00 }
        ],
        total: 179.00,
        shippingAddress: {
          name: 'Ahmed Ben Ali',
          address: '123 Avenue Habib Bourguiba',
          city: 'Tunis',
          postalCode: '1000'
        },
        timeline: [
          { status: 'pending', date: '2024-01-10', description: 'Commande reçue' },
          { status: 'confirmed', date: '2024-01-11', description: 'Commande confirmée' },
          { status: 'processing', date: '2024-01-12', description: 'Commande en préparation' },
          { status: 'shipped', date: '2024-01-13', description: 'Commande expédiée' },
          { status: 'delivered', date: null, description: 'Livraison prévue' }
        ]
      });
      setLoading(false);
    }, 1000);
  };

  const getStatusIcon = (status, isCompleted) => {
    if (isCompleted) {
      return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
    }
    return <ClockIcon className="h-6 w-6 text-gray-400" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmée';
      case 'processing':
        return 'En cours de traitement';
      case 'shipped':
        return 'Expédiée';
      case 'delivered':
        return 'Livrée';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <TruckIcon className="mx-auto h-16 w-16 text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Suivi de Commande
          </h1>
          <p className="text-lg text-gray-600">
            Suivez votre commande en temps réel
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Numéro de commande (ex: #DF2024001)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !orderNumber.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                <span>{loading ? 'Recherche...' : 'Rechercher'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Tracking Results */}
        {trackingResult && (
          <div className="space-y-8">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Commande #{trackingResult.orderNumber}
                  </h2>
                  <p className="text-gray-600">
                    Passée le {new Date().toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(trackingResult.status)}`}>
                  {getStatusText(trackingResult.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Total</h3>
                  <p className="text-2xl font-bold text-blue-600">{trackingResult.total} DT</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Numéro de suivi</h3>
                  <p className="text-lg font-mono text-gray-600">{trackingResult.trackingNumber}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Livraison prévue</h3>
                  <p className="text-lg text-gray-600">
                    {new Date(trackingResult.estimatedDelivery).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Historique de la commande</h3>
              
              <div className="space-y-4">
                {trackingResult.timeline.map((step, index) => {
                  const isCompleted = step.date !== null;
                  const isLast = index === trackingResult.timeline.length - 1;
                  
                  return (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(step.status, isCompleted)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {step.description}
                          </p>
                          {step.date && (
                            <p className="text-sm text-gray-500">
                              {new Date(step.date).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                        {!isLast && (
                          <div className="mt-2 h-4 w-px bg-gray-300 ml-3"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Articles commandés</h3>
              
              <div className="space-y-4">
                {trackingResult.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500">📦</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">
                        Quantité: {item.quantity} • Prix: {item.price} DT
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {(item.price * item.quantity).toFixed(2)} DT
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Adresse de livraison</h3>
              
              <div className="text-gray-600">
                <p className="font-medium">{trackingResult.shippingAddress.name}</p>
                <p>{trackingResult.shippingAddress.address}</p>
                <p>{trackingResult.shippingAddress.postalCode} {trackingResult.shippingAddress.city}</p>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Besoin d'aide ?
          </h3>
          <p className="text-gray-600 mb-6">
            Si vous avez des questions concernant votre commande, n'hésitez pas à nous contacter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Nous contacter
            </a>
            <a
              href="tel:+216XXXXXXXX"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors border border-blue-600"
            >
              📞 Appeler maintenant
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
