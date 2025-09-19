import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ProductFilters = ({ categories, onFilterChange, currentFilters }) => {
  const [localFilters, setLocalFilters] = useState({
    category: currentFilters.category || '',
    minPrice: currentFilters.minPrice || '',
    maxPrice: currentFilters.maxPrice || '',
    brand: currentFilters.brand || '',
    color: currentFilters.color || '',
    size: currentFilters.size || '',
    onSale: currentFilters.onSale || false,
    featured: currentFilters.featured || false
  });

  const brands = ['Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo', 'Gap', 'Levi\'s', 'Calvin Klein'];
  const colors = ['Noir', 'Blanc', 'Rouge', 'Bleu', 'Vert', 'Jaune', 'Rose', 'Gris', 'Marron'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: '',
      minPrice: '',
      maxPrice: '',
      brand: '',
      color: '',
      size: '',
      onSale: false,
      featured: false
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== '' && value !== false
  );

  return (
    <div className="space-y-6">
      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          <XMarkIcon className="h-4 w-4" />
          <span>Effacer tous les filtres</span>
        </button>
      )}

      {/* Category Filter */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Catégorie</h3>
        <select
          value={localFilters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Prix (DT)</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={localFilters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="number"
            placeholder="Max"
            value={localFilters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Brand Filter */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Marque</h3>
        <select
          value={localFilters.brand}
          onChange={(e) => handleFilterChange('brand', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Toutes les marques</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      {/* Color Filter */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Couleur</h3>
        <div className="grid grid-cols-3 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => handleFilterChange('color', localFilters.color === color ? '' : color)}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                localFilters.color === color
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      {/* Size Filter */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Taille</h3>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => handleFilterChange('size', localFilters.size === size ? '' : size)}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                localFilters.size === size
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Special Filters */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Options</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localFilters.onSale}
              onChange={(e) => handleFilterChange('onSale', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">En promotion</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localFilters.featured}
              onChange={(e) => handleFilterChange('featured', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Produits vedettes</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
