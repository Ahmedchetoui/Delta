import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';

const CancelOrderModal = ({ order, isOpen, onClose, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');

  if (!isOpen || !order) return null;

  const predefinedReasons = [
    'Produit non disponible',
    'Erreur de prix',
    'Demande du client',
    'Problème de paiement',
    'Adresse de livraison incorrecte',
    'Commande frauduleuse',
    'Erreur de commande',
    'Autre'
  ];

  const handleReasonChange = (value) => {
    setSelectedReason(value);
    if (value !== 'Autre') {
      setReason(value);
    } else {
      setReason('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast.error('Veuillez spécifier une raison d\'annulation');
      return;
    }

    setLoading(true);

    try {
      await adminService.cancelOrder(order._id, reason);
      toast.success('Commande annulée avec succès');
      onCancel();
      onClose();
      setReason('');
      setSelectedReason('');
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      toast.error('Erreur lors de l\'annulation de la commande');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Annuler la commande
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Commande {order.orderNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avertissement */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Attention : Action irréversible
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Cette action ne peut pas être annulée</li>
                    <li>Le client sera automatiquement notifié par email</li>
                    <li>Le remboursement devra être traité manuellement si nécessaire</li>
                    <li>Les stocks des produits seront automatiquement restaurés</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Informations de la commande */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Informations de la commande
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Client:</span>
                <p className="font-medium text-gray-900">{order.customerName}</p>
              </div>
              <div>
                <span className="text-gray-500">Total:</span>
                <p className="font-medium text-gray-900">{formatCurrency(order.total)}</p>
              </div>
              <div>
                <span className="text-gray-500">Statut actuel:</span>
                <p className="font-medium text-gray-900">{order.statusInFrench}</p>
              </div>
              <div>
                <span className="text-gray-500">Articles:</span>
                <p className="font-medium text-gray-900">{order.totalItems} article(s)</p>
              </div>
            </div>
          </div>

          {/* Raison de l'annulation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison de l'annulation *
            </label>
            <select
              value={selectedReason}
              onChange={(e) => handleReasonChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
              required
            >
              <option value="">Sélectionnez une raison</option>
              {predefinedReasons.map(reasonOption => (
                <option key={reasonOption} value={reasonOption}>
                  {reasonOption}
                </option>
              ))}
            </select>

            {(selectedReason === 'Autre' || selectedReason === '') && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Décrivez la raison de l'annulation..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            )}

            {selectedReason && selectedReason !== 'Autre' && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">
                  <strong>Raison sélectionnée:</strong> {reason}
                </p>
              </div>
            )}
          </div>

          {/* Informations sur les conséquences */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Que se passe-t-il après l'annulation ?
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Le statut de la commande passera à "Annulée"</li>
              <li>• Un email de notification sera envoyé au client</li>
              <li>• Les stocks des produits seront restaurés</li>
              <li>• L'historique de l'annulation sera conservé</li>
              <li>• Le remboursement devra être traité séparément si nécessaire</li>
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
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !reason.trim()}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Annulation...</span>
                </div>
              ) : (
                'Confirmer l\'annulation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelOrderModal;
