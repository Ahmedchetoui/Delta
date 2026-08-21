import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  PhotoIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { categoryService } from '../../services/api';
import { fetchHomeData, invalidateHomeData } from '../../store/slices/homeSlice';
import { resolveImageUrl } from '../../utils/imageUtils';
import { toast } from 'react-toastify';

const AdminCategories = () => {
  const dispatch = useDispatch();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal / Form Add state
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState('');

  // Edit state
  const [editCategory, setEditCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data } = await categoryService.getCategories({ includeInactive: true });
      const list = (data.categories || []).map(c => ({
        id: c._id,
        name: c.name,
        image: c.image,
        productCount: c.productCount ?? 0,
        status: c.isActive !== false ? 'active' : 'inactive'
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

  const refreshPublicCatalog = () => {
    dispatch(invalidateHomeData());
    dispatch(fetchHomeData({ force: true }));
  };

  const handleNewImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImage(file);
      setNewImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImage(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAdd = async (e) => {
    e?.preventDefault?.();
    if (!newName.trim()) {
      toast.error('Veuillez saisir un nom');
      return;
    }
    try {
      setIsSubmitting(true);
      const fd = new FormData();
      fd.append('name', newName.trim());
      if (newImage) fd.append('image', newImage);
      
      await categoryService.createCategory(fd);
      toast.success('Catégorie créée avec succès');
      setNewName('');
      setNewImage(null);
      setNewImagePreview('');
      setShowAdd(false);
      loadCategories();
      refreshPublicCatalog();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Erreur lors de la création';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (cat) => {
    setEditCategory(cat);
    setEditName(cat.name);
    setEditImage(null);
    setEditImagePreview(cat.image ? resolveImageUrl(cat.image) : '');
  };

  const cancelEdit = () => {
    setEditCategory(null);
    setEditName('');
    setEditImage(null);
    setEditImagePreview('');
  };

  const submitEdit = async (e) => {
    e?.preventDefault?.();
    if (!editCategory) return;
    if (!editName.trim()) {
      toast.error('Veuillez saisir un nom');
      return;
    }
    try {
      setIsSubmitting(true);
      const fd = new FormData();
      fd.append('name', editName.trim());
      if (editImage) fd.append('image', editImage);

      await categoryService.updateCategory(editCategory.id, fd);
      toast.success('Catégorie mise à jour avec succès');
      cancelEdit();
      loadCategories();
      refreshPublicCatalog();
    } catch (e) {
      const apiErrors = e?.response?.data?.errors;
      const details = Array.isArray(apiErrors)
        ? apiErrors.map((entry) => entry.msg).join(', ')
        : null;
      const msg = details || e?.response?.data?.message || e?.message || 'Erreur lors de la mise à jour';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette catégorie ?')) return;
    try {
      await categoryService.deleteCategory(id);
      toast.success('Catégorie supprimée');
      setCategories(cs => cs.filter(c => c.id !== id));
      refreshPublicCatalog();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Erreur lors de la suppression';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Catégories</h1>
          <p className="text-gray-600 mt-1">Créez et modifiez vos catégories avec cadrage d'image automatique</p>
        </div>
        <button 
          onClick={() => setShowAdd(s => !s)} 
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow font-bold"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Ajouter une catégorie
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showAdd && (
        <form onSubmit={handleAdd} className="mb-8 bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Nouvelle Catégorie</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom de la catégorie *</label>
                <input 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  placeholder="ex: Enfants, Femmes, Hommes..." 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Image de la catégorie</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleNewImageChange} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isSubmitting} className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 font-bold shadow disabled:opacity-50">
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer la catégorie'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowAdd(false); setNewName(''); setNewImage(null); setNewImagePreview(''); }} 
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>

            {/* Aperçu du cadrage */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Aperçu et Cadrage sur le site (Object-Cover)</label>
              <div className="relative h-48 w-full rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                {newImagePreview ? (
                  <img 
                    src={newImagePreview} 
                    alt="Aperçu" 
                    className="w-full h-full object-cover shadow" 
                  />
                ) : (
                  <div className="text-center text-gray-400 p-4">
                    <PhotoIcon className="h-10 w-10 mx-auto mb-1 text-gray-300" />
                    <p className="text-xs">Sélectionnez une image pour voir le redimensionnement et cadrage automatique</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Formulaire de modification */}
      {editCategory && (
        <form onSubmit={submitEdit} className="mb-8 bg-blue-50/70 rounded-2xl shadow-md border border-blue-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Modifier la catégorie : « {editCategory.name} »</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom de la catégorie *</label>
                <input 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Remplacer l'image (optionnel)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleEditImageChange} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isSubmitting} className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 font-bold shadow disabled:opacity-50">
                  {isSubmitting ? 'Mise à jour...' : 'Mettre à jour la catégorie'}
                </button>
                <button 
                  type="button" 
                  onClick={cancelEdit} 
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-white"
                >
                  Annuler
                </button>
              </div>
            </div>

            {/* Aperçu du cadrage */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Cadrage de l'image (Ajustement automatique sur le cadre)</label>
              <div className="relative h-48 w-full rounded-xl overflow-hidden border-2 border-blue-300 bg-white flex items-center justify-center shadow-md">
                {editImagePreview ? (
                  <img 
                    src={editImagePreview} 
                    alt="Cadrage" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="text-center text-gray-400 p-4">
                    <PhotoIcon className="h-10 w-10 mx-auto mb-1 text-gray-300" />
                    <p className="text-xs">Aucune image enregistrée</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Liste des catégories */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Image & Cadrage
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Produits associés
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                    {category.image ? (
                      <img 
                        src={resolveImageUrl(category.image)} 
                        alt={category.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <PhotoIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{category.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                    {category.productCount} produit(s)
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full ${
                    category.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {category.status === 'active' ? (
                      <>
                        <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-3.5 w-3.5 mr-1" />
                        Inactive
                      </>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => openEdit(category)} 
                      className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 border border-green-300 rounded-lg hover:bg-green-100 transition-colors text-xs font-bold shadow-sm"
                      title="Modifier le nom et l'image de la catégorie"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Modifier
                    </button>
                    <button 
                      onClick={() => handleDelete(category.id)} 
                      className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
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
    </div>
  );
};

export default AdminCategories;
