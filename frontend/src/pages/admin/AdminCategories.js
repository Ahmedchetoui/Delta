import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';
import { categoryService } from '../../services/api';
import { toast } from 'react-toastify';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data } = await categoryService.getCategories({ includeInactive: true });
      const list = (data.categories || []).map(c => ({
        id: c._id,
        name: c.name,
        productCount: c.productCount ?? 0,
        status: c.isActive ? 'active' : 'inactive'
      }));
      setCategories(list);
    } catch (e) {
      toast.error("Impossible de charger les catégories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async (e) => {
    e?.preventDefault?.();
    if (!newName.trim()) {
      toast.error('Veuillez saisir un nom');
      return;
    }
    try {
      const fd = new FormData();
      fd.append('name', newName.trim());
      if (newImage) fd.append('image', newImage);
      await categoryService.createCategory(fd);
      toast.success('Catégorie créée');
      setNewName('');
      setNewImage(null);
      setShowAdd(false);
      loadCategories();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Erreur lors de la création';
      toast.error(msg);
    }
  };

  const openEdit = (id, currentName) => {
    setEditId(id);
    setEditName(currentName);
    setEditImage(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName('');
    setEditImage(null);
  };

  const submitEdit = async (e) => {
    e?.preventDefault?.();
    if (!editId) return;
    if (!editName.trim()) {
      toast.error('Veuillez saisir un nom');
      return;
    }
    try {
      const fd = new FormData();
      fd.append('name', editName.trim());
      if (editImage) fd.append('image', editImage);
      await categoryService.updateCategory(editId, fd);
      toast.success('Catégorie mise à jour');
      cancelEdit();
      loadCategories();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Erreur lors de la mise à jour';
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await categoryService.deleteCategory(id);
      toast.success('Catégorie supprimée');
      setCategories(cs => cs.filter(c => c.id !== id));
    } catch (e) {
      const msg = e?.response?.data?.message || 'Erreur lors de la suppression';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
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
        <h1 className="text-3xl font-bold text-gray-900">Gestion des catégories</h1>
        <button onClick={() => setShowAdd(s=>!s)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter une catégorie
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-6 bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input value={newName} onChange={(e)=>setNewName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Nom de la catégorie" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <input type="file" accept="image/*" onChange={(e)=>setNewImage(e.target.files?.[0] || null)} className="w-full" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Enregistrer</button>
            <button type="button" onClick={()=>{setShowAdd(false); setNewName(''); setNewImage(null);}} className="px-4 py-2 border rounded">Annuler</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre de produits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{category.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{category.productCount}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    category.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {category.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button onClick={() => openEdit(category.id, category.name)} className="text-green-600 hover:text-green-900">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-900">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editId && (
        <form onSubmit={submitEdit} className="mt-6 bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input value={editName} onChange={(e)=>setEditName(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <input type="file" accept="image/*" onChange={(e)=>setEditImage(e.target.files?.[0] || null)} className="w-full" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Mettre à jour</button>
            <button type="button" onClick={cancelEdit} className="px-4 py-2 border rounded">Annuler</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminCategories;
