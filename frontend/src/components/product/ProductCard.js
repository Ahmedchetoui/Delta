import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { HeartIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import Skeleton from '../ui/Skeleton';
import { normalizeProductImages, getProductImageUrl } from '../../utils/productImages';
import { normalizeProductColors, colorNameToHex } from '../../utils/colorUtils';
import { productHasStock, colorsEqual } from '../../utils/productStock';
import { prefetchProduct } from '../../utils/prefetch';

const CARD_IMAGE_WIDTH = 600;

const ProductCard = ({ product, priority = false }) => {
  const dispatch = useDispatch();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handlePrefetch = () => {
    prefetchProduct(dispatch, product._id);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info('Fonctionnalité wishlist à venir !');
  };

  const inStock = productHasStock(product);

  const allImages = useMemo(
    () => normalizeProductImages(product?.images),
    [product?.images]
  );

  // Changement automatique d'image toutes les 3 secondes si plusieurs photos
  useEffect(() => {
    if (allImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImgIndex((prevIndex) => (prevIndex + 1) % allImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [allImages.length]);

  const discountPercent = useMemo(() => {
    if (product?.discount && Number(product.discount) > 0) {
      return Math.round(Number(product.discount));
    }
    if (product?.originalPrice && product?.price && Number(product.originalPrice) > Number(product.price)) {
      return Math.round((1 - Number(product.price) / Number(product.originalPrice)) * 100);
    }
    if (product?.price && product?.finalPrice && Number(product.price) > Number(product.finalPrice)) {
      return Math.round((1 - Number(product.finalPrice) / Number(product.price)) * 100);
    }
    return null;
  }, [product?.discount, product?.originalPrice, product?.price, product?.finalPrice]);

  const derivedSizes = useMemo(() => {
    if (product?.sizes && product.sizes.length > 0) return product.sizes;
    return Array.from(new Set((product?.variants || []).map((v) => v.size).filter(Boolean)));
  }, [product?.sizes, product?.variants]);

  const displayColors = useMemo(
    () => normalizeProductColors(product?.colors, product?.variants),
    [product?.colors, product?.variants]
  );

  const colorItems = displayColors.slice(0, 7);

  const handleColorHover = (colorName) => {
    if (!colorName || !allImages.length) return;
    const idx = allImages.findIndex((img) => colorsEqual(img.color, colorName));
    if (idx !== -1) {
      setCurrentImgIndex(idx);
    }
  };

  const activeImageUrl = allImages.length > 0
    ? getProductImageUrl(allImages[currentImgIndex % allImages.length], CARD_IMAGE_WIDTH)
    : getProductImageUrl(null, CARD_IMAGE_WIDTH);

  return (
    <div
      className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-blue-500 flex flex-col h-full"
      onMouseEnter={() => {
        setIsHovered(true);
        handlePrefetch();
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={`/product/${product._id}`}
        onFocus={handlePrefetch}
        onTouchStart={handlePrefetch}
        className="flex flex-col h-full"
      >
        {/* Cadre Image avec Ratio 3:4 optimisé pour le textile */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
          {!isImageLoaded && (
            <Skeleton className="absolute inset-0 w-full h-full z-10" />
          )}

          {/* Diaporama d'images avec transition fluide */}
          <img
            key={activeImageUrl}
            src={activeImageUrl}
            alt={product.name}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            onLoad={() => setIsImageLoaded(true)}
            className={`w-full h-full object-contain bg-slate-50 p-1 transition-all duration-700 ease-out group-hover:scale-105 ${
              isImageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Badges d'état (PROMO, NOUVEAU) */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
            {discountPercent ? (
              <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full uppercase shadow-lg tracking-wide">
                -{discountPercent}%
              </span>
            ) : product.isOnSale ? (
              <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full uppercase shadow-lg tracking-wide">
                🔥 PROMO
              </span>
            ) : product.isNewProduct ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full uppercase shadow-lg tracking-wide">
                <SparklesIcon className="h-3.5 w-3.5" />
                NOUVEAU
              </span>
            ) : null}
          </div>

          {/* Bouton Favoris */}
          <button
            type="button"
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/90 hover:bg-white text-gray-700 hover:text-red-500 rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 z-20"
            aria-label="Ajouter aux favoris"
          >
            <HeartIcon className="h-5 w-5 transition-colors" />
          </button>

          {/* Indicateurs Diaporama (Changement automatique et manuel d'images) */}
          {allImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-md">
              {allImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImgIndex(idx);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentImgIndex
                      ? 'w-5 bg-white'
                      : 'w-2 bg-white/60 hover:bg-white'
                  }`}
                  title={`Voir photo ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {!inStock && (
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center z-20">
              <span className="text-white font-bold text-sm sm:text-base tracking-wider px-4 py-2 border-2 border-white/80 rounded-lg bg-black/30">
                RUPTURE DE STOCK
              </span>
            </div>
          )}
        </div>

        {/* Détails du Produit */}
        <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-white">
          <div>
            <h3
              className="font-semibold text-gray-900 mb-2.5 line-clamp-2 group-hover:text-blue-600 transition-colors text-base"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {product.name}
            </h3>

            {/* Tailles */}
            {derivedSizes?.length > 0 && (
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-400">Tailles:</span>
                {derivedSizes.slice(0, 5).map((size, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-xs font-medium border border-gray-200 rounded-md text-gray-600 bg-gray-50/50"
                  >
                    {size}
                  </span>
                ))}
                {derivedSizes.length > 5 && (
                  <span className="text-xs text-gray-400 font-medium">+{derivedSizes.length - 5}</span>
                )}
              </div>
            )}

            {/* Couleurs avec changement au survol */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-gray-400">Couleurs:</span>
              {colorItems.length > 0 ? (
                <div className="flex gap-1.5">
                  {colorItems.map((c) => {
                    const hex = c.code || colorNameToHex(c.name);
                    return (
                      <span
                        key={c.name}
                        onMouseEnter={() => handleColorHover(c.name)}
                        className="w-4 h-4 rounded-full border border-gray-300 shadow-xs cursor-pointer hover:scale-125 transition-transform"
                        style={{ backgroundColor: hex }}
                        title={`Couleur ${c.name} (Survoler pour voir)`}
                      />
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs text-gray-400">-</span>
              )}
            </div>
          </div>

          <div>
            {/* Prix & Statut Stock */}
            <div className="flex items-baseline justify-between mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-extrabold text-blue-600">
                  {product.finalPrice ?? product.price} DT
                </span>
                {discountPercent && (
                  <span className="text-xs sm:text-sm text-gray-400 line-through">
                    {product.price} DT
                  </span>
                )}
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {inStock ? '✓ En stock' : 'Rupture'}
              </span>
            </div>

            {/* Bouton Voir Détails */}
            <div className="relative overflow-hidden">
              <span className="inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 border-2 border-blue-600 text-blue-600 group-hover:bg-blue-600 group-hover:text-white cursor-pointer shadow-xs">
                Voir Détails
                <svg
                  className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
