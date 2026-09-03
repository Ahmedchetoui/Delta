import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../context/LanguageContext';

const ProductFilters = ({ categories, onFilterChange, currentFilters }) => {
  const { lang, t } = useLanguage();
  const [localFilters, setLocalFilters] = useState({
    category: currentFilters.category || '',
    minPrice: currentFilters.minPrice || '',
    maxPrice: currentFilters.maxPrice || '',
    color: currentFilters.color || '',
    size: currentFilters.size || '',
    onSale: currentFilters.onSale || false,
    featured: currentFilters.featured || false
  });

  const colorsFr = ['Noir', 'Blanc', 'Rouge', 'Bleu', 'Vert', 'Jaune', 'Rose', 'Gris', 'Marron'];
  const colorsAr = ['أسود', 'أبيض', 'أحمر', 'أزرق', 'أخضر', 'أصفر', 'وردي', 'رمادي', 'بني'];
  const colors = lang === 'ar' ? colorsAr : colorsFr;

  const adultSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const childSizes = ['6', '8', '10', '12', '14', '16'];

  useEffect(() => {
    setLocalFilters({
      category: currentFilters.category || '',
      minPrice: currentFilters.minPrice || '',
      maxPrice: currentFilters.maxPrice || '',
      color: currentFilters.color || '',
      size: currentFilters.size || '',
      onSale: currentFilters.onSale || false,
      featured: currentFilters.featured || false,
    });
  }, [currentFilters]);

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
          className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          <XMarkIcon className="h-4 w-4" />
          <span>{lang === 'ar' ? 'مسح جميع الفلاتر' : 'Effacer tous les filtres'}</span>
        </button>
      )}

      {/* Category Filter */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{lang === 'ar' ? 'القسم' : 'Catégorie'}</h3>
        <select
          value={localFilters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="">{lang === 'ar' ? 'جميع الأقسام' : 'Toutes les catégories'}</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{lang === 'ar' ? `السعر (${t('currency')})` : `Prix (${t('currency')})`}</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder={lang === 'ar' ? 'الأدنى' : 'Min'}
            value={localFilters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <input
            type="number"
            placeholder={lang === 'ar' ? 'الأقصى' : 'Max'}
            value={localFilters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Color Filter */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{lang === 'ar' ? 'اللون' : 'Couleur'}</h3>
        <div className="grid grid-cols-3 gap-2">
          {colors.map((col, idx) => {
            const rawCol = colorsFr[idx];
            return (
              <button
                key={rawCol}
                onClick={() => handleFilterChange('color', localFilters.color === rawCol ? '' : rawCol)}
                className={`px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                  localFilters.color === rawCol
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {col}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size Filter */}
      <div>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{lang === 'ar' ? 'المقاس' : 'Taille'}</h3>
            <div className="grid grid-cols-3 gap-2">
              {adultSizes.map((sz) => (
                <button
                  key={sz}
                  onClick={() => handleFilterChange('size', localFilters.size === sz ? '' : sz)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    localFilters.size === sz
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{lang === 'ar' ? 'مقاسات الأطفال' : 'Taille d\'enfant'}</h3>
            <div className="grid grid-cols-3 gap-2">
              {childSizes.map((sz) => (
                <button
                  key={sz}
                  onClick={() => handleFilterChange('size', localFilters.size === sz ? '' : sz)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    localFilters.size === sz
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Special Filters */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{lang === 'ar' ? 'خيارات' : 'Options'}</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localFilters.onSale}
              onChange={(e) => handleFilterChange('onSale', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 rtl:ml-0 rtl:mr-2 text-sm text-gray-700">{lang === 'ar' ? 'تخفيضات' : 'En promotion'}</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localFilters.featured}
              onChange={(e) => handleFilterChange('featured', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 rtl:ml-0 rtl:mr-2 text-sm text-gray-700">{lang === 'ar' ? 'منتجات مميزة' : 'Produits vedettes'}</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
