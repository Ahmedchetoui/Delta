import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserOrders } from '../store/slices/orderSlice';
import Loading from '../components/ui/Loading';
import { EyeIcon, TruckIcon } from '@heroicons/react/24/outline';

const Orders = () => {
  const dispatch = useDispatch();
  const { orders, isLoading } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchUserOrders());
  }, [dispatch]);

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
      case 'cancelled':
        return 'bg-red-100 text-red-800';
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
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  if (isLoading) {
    return <Loading size="large" text="Chargement de vos commandes..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes Commandes</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <TruckIcon className="mx-auto h-24 w-24 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Aucune commande trouvée
            </h2>
            <p className="text-gray-600 mb-8">
              Vous n'avez pas encore passé de commande. Découvrez nos produits !
            </p>
            <a
              href="/shop"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Commencer mes achats
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Commande #{order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    
                    <div className="mt-4 lg:mt-0 flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                        {getStatusText(order.orderStatus)}
                      </span>
                      
                      <a
                        href={`/orders/${order._id}`}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                      >
                        <EyeIcon className="h-5 w-5" />
                        <span>Voir les détails</span>
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-semibold text-gray-900">{order.total} DT</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Articles</p>
                      <p className="font-semibold text-gray-900">
                        {order.items.reduce((total, item) => total + item.quantity, 0)} article(s)
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Paiement</p>
                      <p className="font-semibold text-gray-900">
                        {order.paymentMethod === 'cash_on_delivery' ? 'À la livraison' : order.paymentMethod}
                      </p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Articles commandés</h4>
                    <div className="space-y-2">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <img
                            src={item.image || '/api/placeholder/50/50'}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Qté: {item.quantity} • {item.price} DT
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-gray-500">
                          +{order.items.length - 3} autre(s) article(s)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      {order.orderStatus === 'pending' && (
                        <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm">
                          Annuler la commande
                        </button>
                      )}
                      
                      {order.orderStatus === 'delivered' && (
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                          Laisser un avis
                        </button>
                      )}
                      
                      <a
                        href={`/order-tracking?order=${order.orderNumber}`}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm text-center"
                      >
                        Suivre la commande
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
