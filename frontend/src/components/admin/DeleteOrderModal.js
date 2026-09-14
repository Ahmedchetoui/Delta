import React, { useState } from 'react';
import { XMarkIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';

const DeleteOrderModal = ({ order, isOpen, onClose, onDelete }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await adminService.deleteOrder(order._id);
      toast.success('Commande supprimée définitivement avec succès');
      onDelete();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la suppression de la commande:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression de la commande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <TrashIcon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Supprimer la commande
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            Êtes-vous certain de vouloir supprimer définitivement la commande{' '}
            <span className="font-bold text-gray-900">{order.orderNumber}</span> d'un montant de{' '}
            <span className="font-bold text-gray-900">{formatCurrency(order.total)}</span> ?
          </p>

          {order.stockDeducted && !['cancelled', 'refunded'].includes(order.orderStatus) && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-amber-800 text-xs leading-5">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                Le stock réservé pour cette commande sera automatiquement restitué à votre catalogue.
              </span>
            </div>
          )}

          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs">
            ⚠️ <strong>Attention :</strong> Cette action est irréversible. Toutes les données associées à cette commande seront effacées.
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center gap-3 p-5 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Suppression...</span>
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4" />
                <span>Supprimer définitivement</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteOrderModal;
