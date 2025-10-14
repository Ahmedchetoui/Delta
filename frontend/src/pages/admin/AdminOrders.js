import React, { useState, useEffect } from 'react';
import { 
  EyeIcon, 
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TruckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/api';
import { toast } from 'react-toastify';
import OrderDetailsModal from '../../components/admin/OrderDetailsModal';
import OrderStatusModal from '../../components/admin/OrderStatusModal';
import CancelOrderModal from '../../components/admin/CancelOrderModal';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0
  });
  
  // Filtres et recherche
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentStatus: '',
    startDate: '',
    endDate: ''
  });
  
  // Modales
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Charger les commandes
  const loadOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...filters
      };
      
      // Nettoyer les paramètres vides
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      const { data } = await adminService.getOrders(params);
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Gestionnaires d'événements
  const handleSearch = () => {
    loadOrders(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleViewDetails = async (orderId) => {
    try {
      const { data } = await adminService.getOrder(orderId);
      setSelectedOrder(data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const handleCancelOrder = (order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  const handlePageChange = (page) => {
    loadOrders(page);
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

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => loadOrders(pagination.currentPage)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <ClockIcon className="h-4 w-4" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">En attente</p>
              <p className="text-lg font-semibold text-gray-900">
                {orders.filter(o => o.orderStatus === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <TruckIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">En cours</p>
              <p className="text-lg font-semibold text-gray-900">
                {orders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.orderStatus)).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CheckIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Livrées</p>
              <p className="text-lg font-semibold text-gray-900">
                {orders.filter(o => o.orderStatus === 'delivered').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Problèmes</p>
              <p className="text-lg font-semibold text-gray-900">
                {orders.filter(o => ['cancelled', 'refunded'].includes(o.orderStatus)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="N° commande, client..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut commande
            </label>
            <select 
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmée</option>
              <option value="processing">En traitement</option>
              <option value="shipped">Expédiée</option>
              <option value="delivered">Livrée</option>
              <option value="cancelled">Annulée</option>
              <option value="refunded">Remboursée</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut paiement
            </label>
            <select 
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="pending">En attente</option>
              <option value="paid">Payé</option>
              <option value="failed">Échoué</option>
              <option value="refunded">Remboursé</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de début
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Filtrer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table des commandes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                N° Commande
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Articles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paiement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                  <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Aucune commande trouvée</p>
                  <p className="text-sm">Essayez de modifier vos filtres de recherche</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.customerName}</div>
                    <div className="text-sm text-gray-500">{order.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.totalItems} article{order.totalItems > 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                      {order.statusInFrench}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatusInFrench}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(order._id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
                        title="Voir les détails"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order)}
                        className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-100"
                        title="Modifier le statut"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {!['delivered', 'cancelled', 'refunded'].includes(order.orderStatus) && (
                        <button
                          onClick={() => handleCancelOrder(order)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100"
                          title="Annuler la commande"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de{' '}
                <span className="font-medium">
                  {(pagination.currentPage - 1) * 20 + 1}
                </span>{' '}
                à{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * 20, pagination.totalOrders)}
                </span>{' '}
                sur{' '}
                <span className="font-medium">{pagination.totalOrders}</span>{' '}
                résultats
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>

                {/* Pages */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />

      <OrderStatusModal
        order={selectedOrder}
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onUpdate={() => loadOrders(pagination.currentPage)}
      />

      <CancelOrderModal
        order={selectedOrder}
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onCancel={() => loadOrders(pagination.currentPage)}
      />
    </div>
  );
};

export default AdminOrders;
