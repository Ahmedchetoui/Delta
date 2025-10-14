import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';

const OrderStatusModal = ({ order, isOpen, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    orderStatus: order?.orderStatus || '',
    paymentStatus: order?.paymentStatus || '',
    trackingNumber: order?.trackingNumber || '',
    adminNotes: order?.notes?.admin || ''
  });

  if (!isOpen || !order) return null;

  const statusOptions = [
    { value: 'pending', label: 'En attente', color: 'yellow' },
    { value: 'confirmed', label: 'Confirmée', color: 'blue' },
    { value: 'processing', label: 'En cours de traitement', color: 'purple' },
    { value: 'shipped', label: 'Expédiée', color: 'indigo' },
    { value: 'delivered', label: 'Livrée', color: 'green' },
    { value: 'cancelled', label: 'Annulée', color: 'red' },
    { value: 'refunded', label: 'Remboursée', color: 'gray' }
  ];

  const paymentStatusOptions = [
    { value: 'pending', label: 'En attente', color: 'yellow' },
    { value: 'paid', label: 'Payé', color: 'green' },
    { value: 'failed', label: 'Échoué', color: 'red' },
    { value: 'refunded', label: 'Remboursé', color: 'gray' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminService.updateOrderStatus(order._id, formData);
      toast.success('Statut de la commande mis à jour avec succès');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status, type = 'order') => {
    const options = type === 'order' ? statusOptions : paymentStatusOptions;
    const option = options.find(opt => opt.value === status);
    return option ? option.color : 'gray';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Modifier le statut
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Commande {order.orderNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Statut de la commande */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut de la commande
            </label>
            <select
              value={formData.orderStatus}
              onChange={(e) => handleInputChange('orderStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="mt-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${getStatusColor(formData.orderStatus)}-100 text-${getStatusColor(formData.orderStatus)}-800`}>
                {statusOptions.find(opt => opt.value === formData.orderStatus)?.label}
              </span>
            </div>
          </div>

          {/* Statut du paiement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut du paiement
            </label>
            <select
              value={formData.paymentStatus}
              onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {paymentStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="mt-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${getStatusColor(formData.paymentStatus, 'payment')}-100 text-${getStatusColor(formData.paymentStatus, 'payment')}-800`}>
                {paymentStatusOptions.find(opt => opt.value === formData.paymentStatus)?.label}
              </span>
            </div>
          </div>

          {/* Numéro de suivi */}
          {['shipped', 'delivered'].includes(formData.orderStatus) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de suivi
              </label>
              <input
                type="text"
                value={formData.trackingNumber}
                onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
                placeholder="Entrez le numéro de suivi..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Le numéro de suivi sera envoyé au client par email
              </p>
            </div>
          )}

          {/* Notes admin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes administrateur
            </label>
            <textarea
              value={formData.adminNotes}
              onChange={(e) => handleInputChange('adminNotes', e.target.value)}
              placeholder="Ajoutez des notes internes..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Ces notes ne sont visibles que par les administrateurs
            </p>
          </div>

          {/* Informations sur les changements */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Informations importantes
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Le client sera automatiquement notifié par email du changement de statut</li>
              <li>• Les changements sont irréversibles pour certains statuts (livré, annulé)</li>
              <li>• Un historique des modifications est conservé</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Mise à jour...</span>
                </div>
              ) : (
                'Mettre à jour'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderStatusModal;
