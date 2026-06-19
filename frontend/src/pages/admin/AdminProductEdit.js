import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import ProductColorPicker from '../../components/admin/ProductColorPicker';
import VariantColorSelect from '../../components/admin/VariantColorSelect';
import ProductImageManager from '../../components/admin/ProductImageManager';
import { normalizeProductColors } from '../../utils/colorUtils';
import { normalizeProductImages } from '../../utils/productImages';

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
    images: [],
    colors: [],
    variants: []
  });

  const [imagesToDelete, setImagesToDelete] = useState([]);

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

  const handleAddImageFiles = (files) => {
    const entries = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      color: formData.colors[0]?.name || '',
      isNew: true,
    }));
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...entries],
    }));
  };

  const handleImagesChange = (images) => {
    const removed = formData.images.filter(
      (existing) =>
        !existing.isNew &&
        !images.some((img) => img.url === existing.url)
    );
    if (removed.length > 0) {
      setImagesToDelete((prev) => [...prev, ...removed.map((img) => img.url)]);
    }
    setFormData((prev) => ({ ...prev, images }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { size: '', color: '', stock: 0 }]
    }));
  };

  const updateVariant = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const removeVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);

    try {
      const submitData = new FormData();
      
      // Données du produit
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('originalPrice', formData.originalPrice);
      submitData.append('category', formData.category);
      submitData.append('isActive', formData.isActive);
      
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

      toast.success('Produit mis à jour avec succès !');
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
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
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

        {/* Prix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix original *
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
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Images du produit
          </label>
          <ProductImageManager
            images={formData.images}
            productColors={formData.colors}
            onChange={handleImagesChange}
            onAddFiles={handleAddImageFiles}
          />
        </div>

        {/* Couleurs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Couleurs du produit
          </label>
          <ProductColorPicker
            colors={formData.colors}
            onChange={(colors) => setFormData((prev) => ({ ...prev, colors }))}
          />
        </div>

        {/* Variantes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Variantes (taille obligatoire, couleur optionnelle)
            </label>
            <button
              type="button"
              onClick={addVariant}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
            >
              + Ajouter variante
            </button>
          </div>
          
          {formData.variants.map((variant, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border rounded-lg">
              <input
                type="text"
                placeholder="Taille (ex: M, L, XL)"
                value={variant.size}
                onChange={(e) => updateVariant(index, 'size', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <VariantColorSelect
                value={variant.color}
                colors={formData.colors}
                onChange={(color) => updateVariant(index, 'color', color)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
              <input
                type="number"
                placeholder="Stock"
                value={variant.stock}
                onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>

        {/* Statut */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700">
            Produit actif (visible sur le site)
          </label>
        </div>

        {/* Boutons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Mise à jour...' : 'Mettre à jour le produit'}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductEdit;
