import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    buttonText: 'Voir les offres',
    buttonLink: '/shop',
    showCollectionBadge: true,
    collectionBadgeText: '✨ NOUVELLE COLLECTION ✨',
    showBrandTitle: true,
    brandTitle: 'DELTA FASHION',
    showButton: true,
    order: 0,
    isActive: true,
    backgroundColor: '#f8f9fa',
    textColor: '#ffffff',
    position: 'center'
  });
  const [imageFile, setImageFile] = useState(null);
  const [mobileImageFile, setMobileImageFile] = useState(null);
  const [removeMobileImage, setRemoveMobileImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const response = await api.get('/banners?includeInactive=true');
      setBanners(response.data.banners);
    } catch (error) {
      toast.error('Erreur lors du chargement des bannières');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    if (!editingBanner && !imageFile) {
      toast.error('Une image est requise');
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          form.append(key, formData[key]);
        }
      });

      if (imageFile) {
        form.append('image', imageFile);
      }
      if (mobileImageFile) {
        form.append('mobileImage', mobileImageFile);
      }
      if (removeMobileImage) {
        form.append('removeMobileImage', 'true');
      }

      if (editingBanner) {
        await api.put(`/banners/${editingBanner._id}`, form);
        toast.success('Bannière mise à jour avec succès');
      } else {
        await api.post('/banners', form);
        toast.success('Bannière créée avec succès');
      }

      resetForm();
      loadBanners();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      buttonText: banner.buttonText || 'Voir les offres',
      buttonLink: banner.buttonLink || '/shop',
      showCollectionBadge: banner.showCollectionBadge !== false,
      collectionBadgeText: banner.collectionBadgeText || '✨ NOUVELLE COLLECTION ✨',
      showBrandTitle: banner.showBrandTitle !== false,
      brandTitle: banner.brandTitle || 'DELTA FASHION',
      showButton: banner.showButton !== false,
      order: banner.order || 0,
      isActive: banner.isActive,
      backgroundColor: banner.backgroundColor,
      textColor: banner.textColor,
      position: banner.position
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette bannière ?')) {
      return;
    }

    try {
      await api.delete(`/banners/${id}`);
      toast.success('Bannière supprimée avec succès');
      loadBanners();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await api.put(`/banners/${id}/toggle`);
      toast.success('Statut mis à jour');
      loadBanners();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      buttonText: 'Voir les offres',
      buttonLink: '/shop',
      showCollectionBadge: true,
      collectionBadgeText: '✨ NOUVELLE COLLECTION ✨',
      showBrandTitle: true,
      brandTitle: 'DELTA FASHION',
      showButton: true,
      order: 0,
      isActive: true,
      backgroundColor: '#f8f9fa',
      textColor: '#ffffff',
      position: 'center'
    });
    setImageFile(null);
    setMobileImageFile(null);
    setRemoveMobileImage(false);
    setEditingBanner(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Bannières</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Ajouter une bannière
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingBanner ? 'Modifier la bannière' : 'Nouvelle bannière'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sous-titre
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows="3"
                />
              </div>

              <fieldset className="rounded-xl border border-blue-200 bg-gradient-to-b from-blue-50/80 to-blue-50/30 p-5 space-y-4">
                <div>
                  <legend className="px-1 text-base font-bold text-blue-950">
                    Éléments affichés sur cette bannière &amp; personnalisation des textes
                  </legend>
                  <p className="text-xs text-blue-700">
                    Cochez les éléments visibles et personnalisez leurs textes pour cette bannière uniquement.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {/* Élément 1: Cadre Badge */}
                  <div className={`rounded-xl border p-3.5 transition-all ${formData.showCollectionBadge ? 'border-blue-300 bg-white shadow-sm' : 'border-gray-200 bg-gray-50/70 opacity-75'}`}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                      <input
                        type="checkbox"
                        checked={formData.showCollectionBadge}
                        onChange={(e) => setFormData({ ...formData, showCollectionBadge: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      Cadre badge
                    </label>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Texte du cadre :
                    </label>
                    <input
                      type="text"
                      disabled={!formData.showCollectionBadge}
                      value={formData.collectionBadgeText}
                      onChange={(e) => setFormData({ ...formData, collectionBadgeText: e.target.value })}
                      placeholder="✨ NOUVELLE COLLECTION ✨"
                      className="w-full border rounded-lg px-2.5 py-1.5 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Élément 2: Grand Titre */}
                  <div className={`rounded-xl border p-3.5 transition-all ${formData.showBrandTitle ? 'border-blue-300 bg-white shadow-sm' : 'border-gray-200 bg-gray-50/70 opacity-75'}`}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                      <input
                        type="checkbox"
                        checked={formData.showBrandTitle}
                        onChange={(e) => setFormData({ ...formData, showBrandTitle: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      Titre principal
                    </label>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Texte du titre :
                    </label>
                    <input
                      type="text"
                      disabled={!formData.showBrandTitle}
                      value={formData.brandTitle}
                      onChange={(e) => setFormData({ ...formData, brandTitle: e.target.value })}
                      placeholder="DELTA FASHION"
                      className="w-full border rounded-lg px-2.5 py-1.5 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Élément 3: Bouton */}
                  <div className={`rounded-xl border p-3.5 transition-all ${formData.showButton ? 'border-blue-300 bg-white shadow-sm' : 'border-gray-200 bg-gray-50/70 opacity-75'}`}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                      <input
                        type="checkbox"
                        checked={formData.showButton}
                        onChange={(e) => setFormData({ ...formData, showButton: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      Bouton d'action
                    </label>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Texte du bouton :
                    </label>
                    <input
                      type="text"
                      disabled={!formData.showButton}
                      value={formData.buttonText}
                      onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                      placeholder="Voir les offres"
                      className="w-full border rounded-lg px-2.5 py-1.5 text-sm mb-2 disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Lien du bouton :
                    </label>
                    <input
                      type="text"
                      disabled={!formData.showButton}
                      value={formData.buttonLink}
                      onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                      placeholder="/shop"
                      className="w-full border rounded-lg px-2.5 py-1.5 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </fieldset>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordre
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position du texte
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="center">Centre</option>
                    <option value="left">Gauche</option>
                    <option value="right">Droite</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Couleur de fond
                  </label>
                  <input
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 h-10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Couleur du texte
                  </label>
                  <input
                    type="color"
                    value={formData.textColor}
                    onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                {/* Image PC / Bureau */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-semibold text-gray-800">
                      💻 Image PC / Bureau {!editingBanner && '*'}
                    </label>
                    <span className="text-xs text-gray-500">Panoramique (~1920x800)</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="w-full text-sm border rounded-lg px-3 py-2 bg-white"
                    required={!editingBanner}
                  />
                  {(imageFile || (editingBanner && editingBanner.image)) && (
                    <div className="mt-2 relative">
                      <img
                        src={imageFile ? URL.createObjectURL(imageFile) : editingBanner.image}
                        alt="Aperçu PC"
                        className="h-20 w-full object-cover rounded border"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                        {imageFile ? 'Nouveau fichier' : 'Image actuelle'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Image Mobile / Smartphone */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-semibold text-gray-800">
                      📱 Image Mobile (Optionnel)
                    </label>
                    <span className="text-xs text-gray-500">Portrait (~800x1000)</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      setMobileImageFile(e.target.files[0]);
                      setRemoveMobileImage(false);
                    }}
                    className="w-full text-sm border rounded-lg px-3 py-2 bg-white"
                  />
                  {(mobileImageFile || (editingBanner && editingBanner.mobileImage && !removeMobileImage)) && (
                    <div className="mt-2 relative flex items-center justify-between bg-white p-1 rounded border">
                      <img
                        src={mobileImageFile ? URL.createObjectURL(mobileImageFile) : editingBanner.mobileImage}
                        alt="Aperçu Mobile"
                        className="h-20 w-16 object-cover rounded border"
                      />
                      <div className="flex-1 ml-2 text-xs text-gray-600">
                        <p className="font-medium text-gray-700">Image Mobile</p>
                        <p className="text-[11px] text-gray-500">Affichée sur smartphones</p>
                      </div>
                      {editingBanner && editingBanner.mobileImage && !mobileImageFile && (
                        <button
                          type="button"
                          onClick={() => setRemoveMobileImage(true)}
                          className="text-xs text-red-600 hover:text-red-800 p-1 border border-red-200 rounded hover:bg-red-50"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  )}
                  {removeMobileImage && (
                    <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 flex justify-between items-center">
                      <span>L'image mobile sera supprimée à l'enregistrement</span>
                      <button
                        type="button"
                        onClick={() => setRemoveMobileImage(false)}
                        className="underline text-blue-600"
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Titre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ordre
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
            {banners.map((banner) => (
              <tr key={banner._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="h-14 w-20 object-cover rounded border shadow-sm"
                      title="Image PC (Bureau)"
                    />
                    {banner.mobileImage && (
                      <img
                        src={banner.mobileImage}
                        alt="Mobile"
                        className="h-14 w-10 object-cover rounded border border-blue-400 shadow-sm"
                        title="Image Mobile (Smartphone)"
                      />
                    )}
                  </div>
                  <div className="mt-1">
                    {banner.mobileImage ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
                        📱 PC + Mobile
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                        💻 PC seul
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{banner.title}</div>
                  {banner.subtitle && (
                    <div className="text-sm text-gray-500">{banner.subtitle}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {banner.order}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${banner.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                    }`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(banner)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleToggleActive(banner._id)}
                    className="text-yellow-600 hover:text-yellow-900"
                  >
                    {banner.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => handleDelete(banner._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {banners.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucune bannière trouvée. Créez votre première bannière !
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBanners;
