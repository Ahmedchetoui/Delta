import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api from '../../services/api';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
    }).format(amount || 0);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/products', { params: { limit: 50 } });
      const list = (data.products || []).map((p) => ({
        id: p._id,
        slug: p.slug,
        name: p.name,
        price: p.finalPrice ?? p.price,
        category: p?.category?.name || '-',
        stock: p.totalStock ?? 0,
        soldCount: p.soldCount ?? 0,
        status: p.isActive ? 'active' : 'inactive',
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
          <h1 className="text-3xl font-bold text-gray-900">Top produits</h1>
          <p className="text-gray-600 mt-1">Gestion et suppression des produits du catalogue</p>
        </div>
        <Link
          to="/admin/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ventes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.soldCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        to={`/product/${product.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir sur le site"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      <Link
                        to={`/admin/products/edit/${product.id}`}
                        className="text-green-600 hover:text-green-900"
                        title="Modifier"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        disabled={deletingId === product.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
