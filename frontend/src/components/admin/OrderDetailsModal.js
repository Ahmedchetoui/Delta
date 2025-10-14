import React from 'react';
import { 
  XMarkIcon,
  UserIcon,
  MapPinIcon,
  CreditCardIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const OrderDetailsModal = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Commande {order.orderNumber}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Créée le {formatDate(order.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Statuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Statut de la commande</h3>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                {order.statusInFrench}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Statut du paiement</h3>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.paymentStatus)}`}>
                {order.paymentStatusInFrench}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Méthode de paiement</h3>
              <p className="text-sm text-gray-900">{order.paymentMethodInFrench}</p>
            </div>
          </div>

          {/* Informations client */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Informations client
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Client</h4>
                <p className="text-sm text-gray-900">{order.customerName}</p>
                <p className="text-sm text-gray-600">{order.customerEmail}</p>
                {order.user?.phone && (
                  <p className="text-sm text-gray-600">{order.user.phone}</p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Type de client</h4>
                <p className="text-sm text-gray-900">
                  {order.user ? 'Client enregistré' : 'Client invité'}
                </p>
              </div>
            </div>
          </div>

          {/* Adresse de livraison */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2" />
              Adresse de livraison
            </h3>
            <div className="text-sm text-gray-900">
              <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
              <p className="mt-2 text-gray-600">
                <strong>Téléphone:</strong> {order.shippingAddress.phone}
              </p>
              <p className="text-gray-600">
                <strong>Email:</strong> {order.shippingAddress.email}
              </p>
              {order.shippingAddress.additionalInfo && (
                <p className="mt-2 text-gray-600">
                  <strong>Informations supplémentaires:</strong> {order.shippingAddress.additionalInfo}
                </p>
              )}
            </div>
          </div>

          {/* Articles commandés */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Articles commandés</h3>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                    {item.size && (
                      <p className="text-sm text-gray-600">Taille: {item.size}</p>
                    )}
                    {item.color && (
                      <p className="text-sm text-gray-600">Couleur: {item.color}</p>
                    )}
                    {item.sku && (
                      <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {item.quantity} × {formatCurrency(item.price)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Total: {formatCurrency(item.quantity * item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Résumé financier */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CreditCardIcon className="h-5 w-5 mr-2" />
              Résumé financier
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sous-total:</span>
                <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.shippingCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frais de livraison:</span>
                  <span className="text-gray-900">{formatCurrency(order.shippingCost)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxes:</span>
                  <span className="text-gray-900">{formatCurrency(order.tax)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remise:</span>
                  <span className="text-red-600">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-lg font-medium">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(order.notes?.customer || order.notes?.admin || order.notes?.internal) && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
              <div className="space-y-3">
                {order.notes.customer && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Note du client:</h4>
                    <p className="text-sm text-gray-900 mt-1">{order.notes.customer}</p>
                  </div>
                )}
                {order.notes.admin && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Note admin:</h4>
                    <p className="text-sm text-gray-900 mt-1">{order.notes.admin}</p>
                  </div>
                )}
                {order.notes.internal && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Note interne:</h4>
                    <p className="text-sm text-gray-900 mt-1">{order.notes.internal}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cadeau */}
          {order.isGift && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">🎁 Commande cadeau</h3>
              {order.giftMessage && (
                <p className="text-sm text-yellow-700">
                  <strong>Message:</strong> {order.giftMessage}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
