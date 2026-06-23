import React, { useState, useEffect, useCallback } from 'react';
import {
  EyeIcon,
  TrashIcon,
  PhoneIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminService } from '../../services/api';

const statusLabels = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  processing: 'En traitement',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
};

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
    }).format(amount || 0);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await adminService.getCustomers({ limit: 50 });
      setCustomers(data.customers || []);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleDeleteOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Supprimer la commande ${orderNumber} ? Cette action est irréversible.`)) {
      return;
    }

    setDeletingOrderId(orderId);
    try {
      await adminService.deleteOrder(orderId);
      toast.success('Commande supprimée');
      await loadCustomers();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingOrderId(null);
    }
  };

  const getCustomerId = (customer, index) => customer._id || `customer-${index}`;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Meilleurs clients</h1>
      <p className="text-gray-600 mb-6">
        Classement par total dépensé — invités (téléphone) et comptes enregistrés.
      </p>

      {customers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Aucune commande client pour le moment.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commandes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total dépensé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer, index) => {
                const customerId = getCustomerId(customer, index);
                const isExpanded = expandedId === customerId;
                const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Client';

                return (
                  <React.Fragment key={customerId}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{fullName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {customer.phone && (
                            <div className="flex items-center text-sm text-gray-900">
                              <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="text-xs text-gray-500">{customer.email}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.orderCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(customer.totalSpent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.isGuest
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {customer.isGuest ? 'Invité' : 'Compte'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : customerId)}
                          className="inline-flex items-center text-blue-600 hover:text-blue-900"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUpIcon className="h-5 w-5 mr-1" />
                              Masquer
                            </>
                          ) : (
                            <>
                              <ChevronDownIcon className="h-5 w-5 mr-1" />
                              Commandes
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-2">
                            {(customer.orders || []).map((order) => (
                              <div
                                key={order._id}
                                className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3"
                              >
                                <div>
                                  <p className="font-medium text-gray-900">{order.orderNumber}</p>
                                  <p className="text-sm text-gray-500">
                                    {statusLabels[order.orderStatus] || order.orderStatus}
                                    {' · '}
                                    {formatCurrency(order.total)}
                                    {' · '}
                                    {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    to="/admin/orders"
                                    className="text-blue-600 hover:text-blue-900 p-1"
                                    title="Voir dans les commandes"
                                  >
                                    <EyeIcon className="h-5 w-5" />
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOrder(order._id, order.orderNumber)}
                                    disabled={deletingOrderId === order._id}
                                    className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                                    title="Supprimer la commande"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
