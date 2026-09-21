import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import ProductColorPicker from '../../components/admin/ProductColorPicker';
import VariantColorSelect from '../../components/admin/VariantColorSelect';
import ProductImageManager from '../../components/admin/ProductImageManager';
import { normalizeProductColors } from '../../utils/colorUtils';
import { normalizeProductImages } from '../../utils/productImages';
import {
  getVariantColorNames,
  hasImageForColor,
  syncProductColorsChange,
} from '../../utils/adminProductHelpers';

const AdminProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    isActive: true,
    isFeatured: true,
    isNew: false,
    isOnSale: false,
    discount: '',
    images: [],
    colors: [],
    variants: []
  });

  const [imagesToDelete, setImagesToDelete] = useState([]);

  const variantColors = useMemo(
    () => getVariantColorNames(formData.variants),
    [formData.variants]
  );

  const openColorPhotoUpload = (colorName) => {
    if (!colorName) return;
    document.getElementById(`color-upload-${colorName}`)?.click();
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger les catégories
        const categoriesRes = await api.get('/categories');
        setCategories(categoriesRes.data.categories || []);

        // Charger le produit
        const productRes = await api.get(`/products/${id}`);
        const product = productRes.data.product;
        
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price || '',
          originalPrice: product.originalPrice || product.price || '',
          category: product.category?._id || '',
          isActive: product.isActive !== false,
          isFeatured: product.isFeatured !== false,
          isNew: !!product.isNewProduct,
          isOnSale: !!product.isOnSale,
          discount: product.discount || '',
          images: normalizeProductImages(product.images).map((img) => ({
            ...img,
            preview: img.url,
            isNew: false,
          })),
          colors: normalizeProductColors(product.colors, product.variants),
          variants: product.variants || []
        });
        
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        toast.error('Erreur lors du chargement du produit');
        navigate('/admin/products');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddImageFiles = (files, color = '') => {
    const entries = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      color,
      isNew: true,
    }));
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...entries],
    }));
  };

  const handleImagesChange = (images) => {
    // Identifier les images supprimées (seulement celles qui étaient déjà sur le serveur)
    const currentUrls = images.map((img) => img.url).filter(Boolean);
    const deleted = formData.images
      .filter((img) => !img.isNew && img.url && !currentUrls.includes(img.url))
      .map((img) => img.url);

    if (deleted.length > 0) {
      setImagesToDelete((prev) => [...prev, ...deleted]);
    }

    setFormData((prev) => ({ ...prev, images }));
  };

  const handleAddVariant = () => {
    const defaultColor = formData.colors[0]?.name || '';
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { size: '', color: defaultColor, stock: 0 }]
    }));
  };

  const handleRemoveVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleVariantChange = (index, field, value) => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      newVariants[index] = {
        ...newVariants[index],
        [field]: value
      };
      return { ...prev, variants: newVariants };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const submitData = new FormData();
      
      // Données du produit
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('originalPrice', formData.originalPrice);
      submitData.append('category', formData.category);
      submitData.append('isActive', String(formData.isActive));
      submitData.append('isFeatured', String(formData.isFeatured));
      submitData.append('isNew', String(formData.isNew));
      submitData.append('isOnSale', String(formData.isOnSale));
      if (formData.discount) {
        submitData.append('discount', String(formData.discount));
      }
      
      // Images existantes à conserver
      const existingImages = formData.images
        .filter((img) => !img.isNew)
        .map(({ url, color }) => ({ url, color: color || '' }));
      submitData.append('existingImages', JSON.stringify(existingImages));
      
      // Images à supprimer
      if (imagesToDelete.length > 0) {
        submitData.append('imagesToDelete', JSON.stringify(imagesToDelete));
      }
      
      // Nouvelles images
      const newImages = formData.images.filter((img) => img.isNew && img.file);
      submitData.append(
        'newImageColors',
        JSON.stringify(newImages.map((img) => img.color || ''))
      );
      newImages.forEach((image) => {
        submitData.append('images', image.file);
      });
      
      // Variantes
      submitData.append('variants', JSON.stringify(formData.variants));
      submitData.append('colors', JSON.stringify(formData.colors));

      await api.put(`/products/${id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Produit mis à jour avec succès');
      navigate('/admin/products');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Modifier le produit</h1>
        <button
          onClick={() => navigate('/admin/products')}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Retour
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Informations de base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du produit *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Prix et Promotion */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix de vente (DT) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix original (avant réduction)
            </label>
            <input
              type="number"
              name="originalPrice"
              value={formData.originalPrice}
              onChange={handleChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remise (%)
            </label>
            <input
              type="number"
              name="discount"
              value={formData.discount}
              onChange={handleChange}
              min="0"
              max="100"
              placeholder="ex: 15"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Statut & Badges du produit */}
        <div className="bg-blue-50/60 p-5 rounded-xl border border-blue-200 space-y-4">
          <h3 className="text-base font-bold text-gray-900">Statuts & Badges d'affichage</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                name="isNew"
                checked={formData.isNew}
                onChange={handleChange}
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-gray-800">
                ✨ Produit Nouveau (Badge Bleu)
              </span>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-gray-800">
                ⭐ En Vedette (Page d'accueil)
              </span>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                name="isOnSale"
                checked={formData.isOnSale}
                onChange={handleChange}
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-gray-800">
                🔥 En Promotion (Badge Promo)
              </span>
            </label>
          </div>
        </div>

        {/* Couleurs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Couleurs du produit
          </label>
          <ProductColorPicker
            colors={formData.colors}
            onChange={(colors) =>
              setFormData((prev) => syncProductColorsChange(prev, colors))
            }
          />
        </div>

        {/* Variantes (Tailles & Stocks) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Variantes (Taille et Stock)
          </label>
          <div className="space-y-3">
            {formData.variants.map((variant, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <input
                  type="text"
                  placeholder="Taille (ex: M, L, XL, 38)"
                  value={variant.size}
                  onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <VariantColorSelect
                  value={variant.color}
                  colors={formData.colors}
                  onChange={(color) => handleVariantChange(index, 'color', color)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={variant.stock}
                  onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value) || 0)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <div className="flex items-center space-x-2">
                  {variant.color ? (
                    <button
                      type="button"
                      onClick={() => openColorPhotoUpload(variant.color)}
                      className={`text-xs px-2 py-1.5 rounded border font-medium ${
                        hasImageForColor(formData.images, variant.color)
                          ? 'border-green-500 text-green-700 bg-green-50'
                          : 'border-amber-500 text-amber-700 bg-amber-50'
                      }`}
                    >
                      {hasImageForColor(formData.images, variant.color)
                        ? '✓ Photo'
                        : '+ Photo'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddVariant}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Ajouter une variante
            </button>
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Images du produit
          </label>
          <ProductImageManager
            images={formData.images}
            productColors={formData.colors}
            variantColors={variantColors}
            onChange={handleImagesChange}
            onAddFiles={handleAddImageFiles}
          />
        </div>

        {/* Statut & Visibilité */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <label className="block text-sm font-bold text-gray-800 mb-2">
            Visibilité sur la boutique *
          </label>
          <select
            name="isActive"
            value={formData.isActive ? 'true' : 'false'}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, isActive: e.target.value === 'true' }))
            }
            className={`w-full md:w-1/2 px-4 py-2.5 rounded-lg font-semibold text-sm border focus:ring-2 focus:outline-none ${
              formData.isActive
                ? 'bg-green-50 border-green-400 text-green-800 focus:ring-green-500'
                : 'bg-red-50 border-red-400 text-red-800 focus:ring-red-500'
            }`}
          >
            <option value="true">🟢 Publié (Visible sur le site)</option>
            <option value="false">🔴 Inactif / Masqué (Caché sur la boutique)</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Note: Si le stock total des variantes est à 0, le site affichera automatiquement le badge <strong>"RUPTURE DE STOCK"</strong> sur le produit.
          </p>
        </div>

        {/* Boutons */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-bold disabled:opacity-50 shadow"
          >
            {saving ? 'Enregistrement...' : 'Mettre à jour le produit'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-bold"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductEdit;
