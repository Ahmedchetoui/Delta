import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryService, productService } from '../../services/api';
import { toast } from 'react-toastify';
import ProductColorPicker from '../../components/admin/ProductColorPicker';
import VariantColorSelect from '../../components/admin/VariantColorSelect';
import ProductImageManager from '../../components/admin/ProductImageManager';
import {
  getVariantColorNames,
  hasImageForColor,
  syncProductColorsChange,
} from '../../utils/adminProductHelpers';

const AdminProductNew = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isActive: true,
    isFeatured: true,
    isNew: false,
    isOnSale: false,
    discount: '',
    colors: [],
    variants: [{ size: 'M', color: '', stock: 0 }],
    images: []
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await categoryService.getCategories({ includeInactive: true });
        setCategories(data.categories || []);
      } catch (e) {
        toast.error("Impossible de charger les catégories");
      } finally {
        setLoadingCats(false);
      }
    };
    load();
  }, []);

  const variantColors = useMemo(
    () => getVariantColorNames(form.variants),
    [form.variants]
  );

  const onAddImageFiles = (files, color = '') => {
    const entries = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      color,
      isNew: true,
    }));
    setForm((f) => ({ ...f, images: [...f.images, ...entries] }));
  };

  const openColorPhotoUpload = (colorName) => {
    if (!colorName) return;
    document.getElementById(`color-upload-${colorName}`)?.click();
  };

  const updateImages = (images) => {
    setForm((f) => ({ ...f, images }));
  };

  const updateVariant = (idx, patch) => {
    setForm((f) => {
      const v = [...f.variants];
      v[idx] = { ...v[idx], ...patch };
      return { ...f, variants: v };
    });
  };

  const addVariant = () => setForm((f) => ({ ...f, variants: [...f.variants, { size: '', color: f.colors[0]?.name || '', stock: 0 }] }));
  const removeVariant = (idx) => setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));

  const canSave = useMemo(() => {
    return form.name.trim() && form.description.trim() && form.price && form.category && form.images.length > 0;
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('description', form.description.trim());
      fd.append('shortDescription', form.description.trim().substring(0, 100));
      fd.append('price', String(form.price));
      fd.append('category', form.category);
      if (form.discount) fd.append('discount', String(form.discount));
      fd.append('isFeatured', String(form.isFeatured));
      fd.append('isNew', String(form.isNew));
      fd.append('isOnSale', String(form.isOnSale));
      fd.append('variants', JSON.stringify(form.variants.map(v => ({
        size: v.size,
        color: v.color,
        stock: Number(v.stock || 0)
      }))));
      if (form.colors.length > 0) {
        fd.append('colors', JSON.stringify(form.colors));
      }
      fd.append(
        'imageColors',
        JSON.stringify(form.images.map((img) => img.color || ''))
      );
      for (const image of form.images) {
        if (image.file) fd.append('images', image.file);
      }

      await productService.createProduct(fd);
      toast.success('Produit créé');
      navigate('/admin/products');
    } catch (err) {
      console.error('Erreur création produit:', err);
      const msg = err?.response?.data?.message
        || err?.response?.data?.errors?.join?.(', ')
        || 'Erreur lors de la création du produit';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nouveau produit</h1>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom</label>
          <input className="mt-1 w-full border rounded px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea className="mt-1 w-full border rounded px-3 py-2" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Prix</label>
            <input type="number" step="0.01" className="mt-1 w-full border rounded px-3 py-2" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Remise (%)</label>
            <input type="number" step="1" min="0" max="100" className="mt-1 w-full border rounded px-3 py-2" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Catégorie</label>
            <select className="mt-1 w-full border rounded px-3 py-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
              <option value="" disabled>{loadingCats ? 'Chargement...' : 'Choisir...'}</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="inline-flex items-center space-x-2">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
            <span>En vedette</span>
          </label>
          <label className="inline-flex items-center space-x-2">
            <input type="checkbox" checked={form.isNew} onChange={(e) => setForm({ ...form, isNew: e.target.checked })} />
            <span>Nouveau</span>
          </label>
          <label className="inline-flex items-center space-x-2">
            <input type="checkbox" checked={form.isOnSale} onChange={(e) => setForm({ ...form, isOnSale: e.target.checked })} />
            <span>En promotion</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Couleurs du produit</label>
          <ProductColorPicker
            colors={form.colors}
            onChange={(colors) => setForm((f) => syncProductColorsChange(f, colors))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Variantes (taille obligatoire, couleur optionnelle)
          </label>
          <div className="space-y-3">
            {form.variants.map((v, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                <input placeholder="Taille (ex: 8, M, 42)" className="border rounded px-3 py-2" value={v.size} onChange={(e) => updateVariant(idx, { size: e.target.value })} />
                <VariantColorSelect
                  value={v.color}
                  colors={form.colors}
                  onChange={(color) => updateVariant(idx, { color })}
                  className="border rounded px-3 py-2 w-full"
                />
                <input type="number" placeholder="Stock" className="border rounded px-3 py-2" value={v.stock} onChange={(e) => updateVariant(idx, { stock: e.target.value })} />
                {v.color ? (
                  <button
                    type="button"
                    onClick={() => openColorPhotoUpload(v.color)}
                    className={`text-sm px-2 py-1 rounded border ${
                      hasImageForColor(form.images, v.color)
                        ? 'border-green-500 text-green-700 bg-green-50'
                        : 'border-amber-500 text-amber-700 bg-amber-50'
                    }`}
                  >
                    {hasImageForColor(form.images, v.color) ? '✓ Photo' : '+ Photo'}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Couleur → photo</span>
                )}
                <button type="button" className="text-red-600" onClick={() => removeVariant(idx)}>Supprimer</button>
              </div>
            ))}
            <button type="button" className="text-blue-600" onClick={addVariant}>+ Ajouter une variante</button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Images du produit par couleur
          </label>
          <ProductImageManager
            images={form.images}
            productColors={form.colors}
            variantColors={variantColors}
            onChange={updateImages}
            onAddFiles={onAddImageFiles}
          />
        </div>

        <div className="pt-4 flex items-center gap-3">
          <button type="submit" disabled={!canSave || saving} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Créer le produit'}
          </button>
          <button type="button" className="px-4 py-2" onClick={() => navigate('/admin/products')}>Annuler</button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductNew;

