import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import Skeleton from '../ui/Skeleton';

const ProductCard = ({ product }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info('Fonctionnalité wishlist à venir !');
  };

  // Helpers
  const discountPercent = product.price && product.finalPrice && Number(product.price) > Number(product.finalPrice)
    ? Math.round((1 - product.finalPrice / product.price) * 100)
    : null;

  const derivedSizes = product.sizes && product.sizes.length > 0
    ? product.sizes
    : Array.from(new Set((product.variants || []).map(v => v.size).filter(Boolean)));

  const derivedColors = (product.colors && product.colors.length > 0
    ? product.colors
    : Array.from(new Set((product.variants || []).map(v => v.color).filter(Boolean))))
    .map(c => (typeof c === 'string' ? { name: c, code: '' } : c));

  const colorItems = derivedColors.slice(0, 7);

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 border-transparent hover:border-blue-500">
      <Link to={`/product/${product._id}`}>
        {/* Image Container */}
        <div className="relative h-64 md:h-72 overflow-hidden bg-gray-100">
          {!isImageLoaded && (
            <Skeleton className="absolute inset-0 w-full h-full z-10" />
          )}
          <img
            src={product.images?.[0] || '/api/placeholder/300/300'}
            alt={product.name}
            loading="lazy"
            onLoad={() => setIsImageLoaded(true)}
            width="300"
            height="300"
            className={`w-full h-full object-cover transition-all duration-700 ${isImageLoaded ? 'scale-100 opacity-100' : 'scale-110 opacity-0'} group-hover:scale-110`}
          />

          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
            {discountPercent ? (
              <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full uppercase shadow-lg">
                -{discountPercent}%
              </span>
            ) : product.isNewProduct ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full uppercase shadow-lg">
                <SparklesIcon className="h-3 w-3" />
                NOUVEAU
              </span>
            ) : null}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 z-20"
            aria-label="Ajouter aux favoris"
          >
            <HeartIcon className="h-5 w-5 text-gray-700 hover:text-red-500 transition-colors" />
          </button>

          {/* Stock Indicator */}
          {product.totalStock === 0 && (
            <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center z-20">
              <span className="text-white font-bold text-lg">RUPTURE DE STOCK</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            {product.name}
          </h3>

          {/* Sizes */}
          {derivedSizes?.length > 0 && (
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-500">Tailles:</span>
              {derivedSizes.slice(0, 5).map((size, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-xs border border-gray-300 rounded-md text-gray-600 hover:border-blue-600 hover:text-blue-600 transition-colors"
                >
                  {size}
                </span>
              ))}
              {derivedSizes.length > 5 && (
                <span className="text-xs text-gray-400">+{derivedSizes.length - 5}</span>
              )}
            </div>
          )}

          {/* Colors */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-gray-500">Couleurs:</span>
            {colorItems.length > 0 ? (
              <div className="flex gap-1.5">
                {colorItems.map((c, idx) => (
                  <span
                    key={idx}
                    className="w-5 h-5 rounded-full border-2 border-gray-200 hover:border-blue-600 transition-colors cursor-pointer shadow-sm"
                    style={{ backgroundColor: c.code || c.hex || c.name || '#ddd' }}
                    title={c.name || (typeof c === 'string' ? c : '')}
                  />
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-400">-</span>
            )}
          </div>

          {/* Price & Stock */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600">
                {product.finalPrice} DT
              </span>
              {discountPercent && (
                <span className="text-sm text-gray-400 line-through">
                  {product.price} DT
                </span>
              )}
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${product.totalStock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {product.totalStock > 0 ? '✓ Disponible' : 'Rupture'}
            </span>
          </div>

          {/* Button */}
          <div className="relative overflow-hidden">
            <span className="inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition-all duration-300 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white cursor-pointer">
              Voir Détails
              <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
