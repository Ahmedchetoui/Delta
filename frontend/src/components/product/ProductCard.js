import React from 'react';
import { Link } from 'react-router-dom';
// import { useDispatch } from 'react-redux';
import { HeartIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const ProductCard = ({ product }) => {
  // const dispatch = useDispatch();

  // Ancien ajout panier (désactivé sur cette carte spécifique)

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implémenter la wishlist
    toast.info('Fonctionnalité wishlist à venir !');
  };

  // Helpers
  const discountPercent = product.price && product.finalPrice && Number(product.price) > Number(product.finalPrice)
    ? Math.round((1 - product.finalPrice / product.price) * 100)
    : null;
  // Dériver couleurs / tailles si absentes, à partir des variantes
  const derivedSizes = product.sizes && product.sizes.length > 0
    ? product.sizes
    : Array.from(new Set((product.variants || []).map(v => v.size).filter(Boolean)));
  const derivedColors = (product.colors && product.colors.length > 0
    ? product.colors
    : Array.from(new Set((product.variants || []).map(v => v.color).filter(Boolean))))
      .map(c => (typeof c === 'string' ? { name: c, code: '' } : c));
  const colorItems = derivedColors.slice(0, 7);

  return (
    <div className="group bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <Link to={`/product/${product._id}`}>
        <div className="relative h-60 overflow-hidden">
          <img
            src={product.images?.[0] || '/api/placeholder/300/300'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Badge remise / nouveau */}
          <div className="absolute top-3 left-3">
            {discountPercent ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-200 text-amber-800">-{discountPercent}%</span>
            ) : product.isNewProduct ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-200 text-green-800">Nouveau</span>
            ) : null}
          </div>
          {/* Wishlist bouton */}
            <button
              onClick={handleWishlist}
            className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow"
            aria-label="wishlist"
          >
            <HeartIcon className="h-5 w-5 text-gray-700" />
            </button>
        </div>

        <div className="p-5">
          <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2">
            {product.name}
          </h3>
          
          {/* Tailles */}
          {derivedSizes?.length > 0 && (
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold">Tailles:</span>
              <span className="ml-2">{derivedSizes.join(' , ')}</span>
            </p>
          )}

          {/* Couleurs */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-semibold text-gray-600">Couleurs:</span>
            {colorItems.length > 0 ? (
              colorItems.map((c, idx) => (
                <span
                  key={idx}
                  className="w-3.5 h-3.5 rounded-full border border-gray-300"
                  style={{ backgroundColor: c.code || c.hex || c.name || '#ddd' }}
                  title={c.name || (typeof c === 'string' ? c : '')}
                />
              ))
            ) : (
              <span className="text-sm text-gray-400">-</span>
              )}
            </div>
            
          {/* Prix + stock */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <span className="text-xl font-extrabold text-amber-600">{product.finalPrice} DT</span>
              {discountPercent && (
                <span className="text-sm text-gray-500 line-through">{product.price} DT</span>
              )}
            </div>
            <span className={`text-sm ${product.totalStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {product.totalStock > 0 ? 'En stock' : 'Rupture'}
            </span>
          </div>

          {/* Bouton */}
          <div className="mt-4">
            <span className="inline-flex w-full items-center justify-center rounded-xl border border-amber-300 px-5 py-3 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100">
              Voir Détails
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
