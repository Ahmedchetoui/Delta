import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { TUNISIA_GOVERNORATES } from '../../constants/tunisiaGovernorates';

const AdminFiabilo = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalOrders: 0 });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();

      const { data } = await api.get('/admin/fiabilo/orders', { params });
      setOrders(data.orders || []);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalOrders: 0 });
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des commandes Fiabilo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrders(1);
  };

  const handleConfirm = async (orderId) => {
    if (!window.confirm('Confirmer l\'envoi de cette commande sur le site Fiabilo ?')) return;

    setActionLoading(orderId);
    try {
      const { data } = await api.post(`/admin/fiabilo/orders/${orderId}/confirm`);
      toast.success(data.message || 'Commande envoyée à Fiabilo');
      fetchOrders(pagination.currentPage);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la confirmation Fiabilo');
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (order) => {
    setSelectedOrder(order);
    setEditForm({
      firstName: order.shippingAddress?.firstName || '',
      lastName: order.shippingAddress?.lastName || '',
      phone: order.shippingAddress?.phone || '',
      street: order.shippingAddress?.street || '',
      governorate: order.shippingAddress?.governorate || '',
      city: order.shippingAddress?.city || '',
      postalCode: order.shippingAddress?.postalCode || '',
      customerNote: order.notes?.customer || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setActionLoading(selectedOrder._id);
    try {
      const { data } = await api.put(`/admin/fiabilo/orders/${selectedOrder._id}`, {
        shippingAddress: {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          phone: editForm.phone,
          street: editForm.street,
          governorate: editForm.governorate,
          city: editForm.city,
          postalCode: editForm.postalCode,
        },
        notes: { customer: editForm.customerNote },
      });
      toast.success(data.message || 'Commande mise à jour');
      setShowEditModal(false);
      setSelectedOrder(null);
      fetchOrders(pagination.currentPage);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Supprimer cette commande ? Le stock sera restauré.')) return;

    setActionLoading(orderId);
    try {
      const { data } = await api.delete(`/admin/fiabilo/orders/${orderId}`);
      toast.success(data.message || 'Commande supprimée');
      fetchOrders(pagination.currentPage);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setActionLoading(null);
    }
  };

  const formatItems = (items = []) =>
    items
      .map((item) => {
        const parts = [item.name];
        if (item.size) parts.push(item.size);
        if (item.color) parts.push(item.color);
        const label = parts.join(' - ');
        return item.quantity > 1 ? `${label} ×${item.quantity}` : label;
      })
      .join(', ');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-2">
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TruckIcon className="w-7 h-7 text-orange-600" />
            Commandes Fiabilo
          </h1>
          <p className="text-gray-600 mt-1">
            Commandes en attente de validation. Envoyez-les sur Fiabilo uniquement après vérification.
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, téléphone, n° commande..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Rechercher
        </button>
      </form>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow text-gray-500">
          Aucune commande en attente Fiabilo
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commande</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Articles</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{order.orderNumber}</div>
                      <div className="text-gray-500 text-xs">
                        {new Date(order.createdAt).toLocaleString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-gray-500">{order.customerPhone}</div>
                      <div className="text-gray-500 text-xs">
                        {order.shippingAddress?.city}, {order.shippingAddress?.governorate}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                      {formatItems(order.items)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      {order.total?.toFixed(2)} DT
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.fiabilo?.syncStatus === 'error' ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                          Erreur Fiabilo
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                          En attente admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(order)}
                          disabled={actionLoading === order._id}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Modifier"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleConfirm(order._id)}
                          disabled={actionLoading === order._id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Confirmer sur Fiabilo"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(order._id)}
                          disabled={actionLoading === order._id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Supprimer"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {pagination.totalOrders} commande(s)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.currentPage <= 1}
                  onClick={() => fetchOrders(pagination.currentPage - 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Précédent
                </button>
                <span className="px-3 py-1 text-sm">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => fetchOrders(pagination.currentPage + 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showEditModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              Modifier la commande {selectedOrder.orderNumber}
            </h2>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Prénom"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="border rounded-lg px-3 py-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Nom"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Téléphone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              <textarea
                placeholder="Adresse"
                value={editForm.street}
                onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                rows={2}
                required
              />
              <select
                value={editForm.governorate}
                onChange={(e) => setEditForm({ ...editForm, governorate: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                {TUNISIA_GOVERNORATES.map((gov) => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Ville"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
              <textarea
                placeholder="Note client (optionnel)"
                value={editForm.customerNote}
                onChange={(e) => setEditForm({ ...editForm, customerNote: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                rows={2}
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading === selectedOrder._id}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFiabilo;
