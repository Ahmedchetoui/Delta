import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api from '../../services/api';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
    }).format(amount || 0);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/products', { params: { limit: 50, includeInactive: 'true' } });
      const list = (data.products || []).map((p) => ({
        id: p._id,
        slug: p.slug,
        name: p.name,
        price: p.finalPrice ?? p.price,
        category: p?.category?.name || '-',
        stock: p.totalStock ?? 0,
        soldCount: p.soldCount ?? 0,
        isActive: p.isActive !== false,
      }));
      setProducts(list);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleToggleStatus = async (product) => {
    setTogglingId(product.id);
    const newStatus = !product.isActive;
    try {
      const formData = new FormData();
      formData.append('isActive', String(newStatus));
      await api.put(`/products/${product.id}`, formData);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: newStatus } : p))
      );
      toast.success(newStatus ? 'Produit désormais Publié sur le site' : 'Produit désormais Masqué / Inactif');
    } catch (error) {
      console.error(error);
      toast.error('Impossible de modifier le statut');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Supprimer le produit « ${product.name} » ?`)) return;

    setDeletingId(product.id);
    try {
      await api.delete(`/products/${product.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success('Produit supprimé');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Produits</h1>
          <p className="text-gray-600 mt-1">Consultez, modifiez les prix/stocks, et changez le statut des produits</p>
        </div>
        <Link
          to="/admin/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter un produit
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Aucun produit dans le catalogue.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Produit</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Prix</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut Visibilité (Cliquer pour changer)</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{product.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {product.stock > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ En stock ({product.stock})
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ⚠ Rupture (0)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(product)}
                      disabled={togglingId === product.id}
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                        product.isActive
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                      }`}
                      title="Cliquer pour changer le statut"
                    >
                      {product.isActive ? (
                        <>
                          <CheckCircleIcon className="h-4 w-4 mr-1 text-white" />
                          🟢 Publié / Actif
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-4 w-4 mr-1 text-gray-600" />
                          🔴 Masqué / Inactif
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/admin/products/edit/${product.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors text-xs font-bold shadow-sm"
                        title="Modifier tous les détails du produit"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Modifier
                      </Link>
                      <Link
                        to={`/product/${product.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir sur le site"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product.id}
                        className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
