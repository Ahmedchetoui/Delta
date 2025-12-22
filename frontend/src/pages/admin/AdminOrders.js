import React, { useState, useEffect } from 'react';
import {
    EyeIcon,
    PencilIcon,
    XCircleIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import OrderDetailsModal from '../../components/admin/OrderDetailsModal';
import OrderStatusModal from '../../components/admin/OrderStatusModal';
import CancelOrderModal from '../../components/admin/CancelOrderModal';
import { toast } from 'react-toastify';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalOrders: 0
    });

    // Filtres
    const [filters, setFilters] = useState({
        status: '',
        paymentStatus: '',
        search: ''
    });

    // Modals
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const statusLabels = {
        pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
        confirmed: { label: 'Confirmée', color: 'bg-blue-100 text-blue-800' },
        processing: { label: 'En traitement', color: 'bg-purple-100 text-purple-800' },
        shipped: { label: 'Expédiée', color: 'bg-indigo-100 text-indigo-800' },
        delivered: { label: 'Livrée', color: 'bg-green-100 text-green-800' },
        cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
        refunded: { label: 'Remboursée', color: 'bg-gray-100 text-gray-800' }
    };

    const paymentStatusLabels = {
        pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
        paid: { label: 'Payé', color: 'bg-green-100 text-green-800' },
        failed: { label: 'Échoué', color: 'bg-red-100 text-red-800' },
        refunded: { label: 'Remboursé', color: 'bg-gray-100 text-gray-800' }
    };

    const fetchOrders = async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: 10
            };

            if (filters.status) params.status = filters.status;
            if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;

            const { data } = await api.get('/admin/orders', { params });

            // Enrichir les commandes avec les labels en français
            const enrichedOrders = (data.orders || []).map(order => ({
                ...order,
                statusInFrench: statusLabels[order.orderStatus]?.label || order.orderStatus,
                paymentStatusInFrench: paymentStatusLabels[order.paymentStatus]?.label || order.paymentStatus,
                paymentMethodInFrench: getPaymentMethodLabel(order.paymentMethod),
                customerName: order.user
                    ? `${order.user.firstName} ${order.user.lastName}`
                    : `${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`,
                customerEmail: order.user?.email || order.guestEmail || order.shippingAddress?.email
            }));

            setOrders(enrichedOrders);
            setPagination(data.pagination || {
                currentPage: page,
                totalPages: 1,
                totalOrders: enrichedOrders.length
            });
        } catch (error) {
            console.error('Erreur lors du chargement des commandes:', error);
            toast.error('Erreur lors du chargement des commandes');
        } finally {
            setLoading(false);
        }
    };

    const getPaymentMethodLabel = (method) => {
        const methods = {
            cash_on_delivery: 'Paiement à la livraison',
            bank_transfer: 'Virement bancaire',
            paypal: 'PayPal',
            stripe: 'Carte bancaire'
        };
        return methods[method] || method;
    };

    useEffect(() => {
        fetchOrders(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.status, filters.paymentStatus]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-TN', {
            style: 'currency',
            currency: 'TND'
        }).format(amount);
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

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setShowDetailsModal(true);
    };

    const handleEditStatus = (order) => {
        setSelectedOrder(order);
        setShowStatusModal(true);
    };

    const handleCancelOrder = (order) => {
        setSelectedOrder(order);
        setShowCancelModal(true);
    };

    const handleOrderUpdated = () => {
        fetchOrders(pagination.currentPage);
    };

    const filteredOrders = orders.filter(order => {
        if (!filters.search) return true;
        const searchLower = filters.search.toLowerCase();
        return (
            order.orderNumber?.toLowerCase().includes(searchLower) ||
            order.customerName?.toLowerCase().includes(searchLower) ||
            order.customerEmail?.toLowerCase().includes(searchLower)
        );
    });

    if (loading && orders.length === 0) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Gestion des commandes</h1>
                <div className="text-sm text-gray-500">
                    {pagination.totalOrders} commande(s) au total
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center">
                        <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Filtres:</span>
                    </div>

                    {/* Recherche */}
                    <div className="relative flex-1 min-w-[200px]">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Rechercher par n° commande, client..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Statut commande */}
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tous les statuts</option>
                        {Object.entries(statusLabels).map(([value, { label }]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>

                    {/* Statut paiement */}
                    <select
                        value={filters.paymentStatus}
                        onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tous les paiements</option>
                        {Object.entries(paymentStatusLabels).map(([value, { label }]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>

                    {/* Réinitialiser */}
                    {(filters.status || filters.paymentStatus || filters.search) && (
                        <button
                            onClick={() => setFilters({ status: '', paymentStatus: '', search: '' })}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Réinitialiser
                        </button>
                    )}
                </div>
            </div>

            {/* Tableau des commandes */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
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
                                    Date
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
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-lg font-medium">Aucune commande trouvée</p>
                                            <p className="text-sm">Modifiez vos filtres ou attendez de nouvelles commandes</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-blue-600">
                                                {order.orderNumber}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {order.items?.length || 0} article(s)
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {order.customerName}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {order.customerEmail}
                                            </div>
                                            {!order.user && (
                                                <span className="inline-flex px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                                    Invité
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(order.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatCurrency(order.total)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusLabels[order.orderStatus]?.color || 'bg-gray-100 text-gray-800'}`}>
                                                {order.statusInFrench}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${paymentStatusLabels[order.paymentStatus]?.color || 'bg-gray-100 text-gray-800'}`}>
                                                {order.paymentStatusInFrench}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleViewDetails(order)}
                                                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                    title="Voir les détails"
                                                >
                                                    <EyeIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditStatus(order)}
                                                    className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                                    title="Modifier le statut"
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                {!['delivered', 'cancelled', 'refunded'].includes(order.orderStatus) && (
                                                    <button
                                                        onClick={() => handleCancelOrder(order)}
                                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                        title="Annuler la commande"
                                                    >
                                                        <XCircleIcon className="h-5 w-5" />
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
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => fetchOrders(pagination.currentPage - 1)}
                                disabled={pagination.currentPage <= 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Précédent
                            </button>
                            <button
                                onClick={() => fetchOrders(pagination.currentPage + 1)}
                                disabled={pagination.currentPage >= pagination.totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Suivant
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Page <span className="font-medium">{pagination.currentPage}</span> sur{' '}
                                    <span className="font-medium">{pagination.totalPages}</span>
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => fetchOrders(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage <= 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeftIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => fetchOrders(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage >= pagination.totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRightIcon className="h-5 w-5" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <OrderDetailsModal
                order={selectedOrder}
                isOpen={showDetailsModal}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedOrder(null);
                }}
            />

            <OrderStatusModal
                order={selectedOrder}
                isOpen={showStatusModal}
                onClose={() => {
                    setShowStatusModal(false);
                    setSelectedOrder(null);
                }}
                onUpdate={handleOrderUpdated}
            />

            <CancelOrderModal
                order={selectedOrder}
                isOpen={showCancelModal}
                onClose={() => {
                    setShowCancelModal(false);
                    setSelectedOrder(null);
                }}
                onCancel={handleOrderUpdated}
            />
        </div>
    );
};

export default AdminOrders;
