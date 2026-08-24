import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { HeartIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import Skeleton from '../ui/Skeleton';
import { normalizeProductImages, getProductImageUrl } from '../../utils/productImages';
import { normalizeProductColors, colorNameToHex } from '../../utils/colorUtils';
import { productHasStock } from '../../utils/productStock';
import { prefetchProduct } from '../../utils/prefetch';

const CARD_IMAGE_WIDTH = 600;

const ProductCard = ({ product, priority = false }) => {
  const dispatch = useDispatch();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const handlePrefetch = () => {
    prefetchProduct(dispatch, product._id);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info('Fonctionnalité wishlist à venir !');
  };

  const inStock = productHasStock(product);

  const discountPercent = useMemo(() => {
    if (product.discount && Number(product.discount) > 0) {
      return Math.round(Number(product.discount));
    }
    if (product.originalPrice && product.price && Number(product.originalPrice) > Number(product.price)) {
      return Math.round((1 - Number(product.price) / Number(product.originalPrice)) * 100);
    }
    if (product.price && product.finalPrice && Number(product.price) > Number(product.finalPrice)) {
      return Math.round((1 - Number(product.finalPrice) / Number(product.price)) * 100);
    }
    return null;
  }, [product.discount, product.originalPrice, product.price, product.finalPrice]);

  const derivedSizes = product.sizes && product.sizes.length > 0
    ? product.sizes
    : Array.from(new Set((product.variants || []).map((v) => v.size).filter(Boolean)));

  const displayColors = useMemo(
    () => normalizeProductColors(product.colors, product.variants),
    [product.colors, product.variants]
  );

  const colorItems = displayColors.slice(0, 7);

  // Normalisation de toutes les images disponibles du produit
  const allImages = useMemo(() => {
    const list = normalizeProductImages(product.images);
    if (list.length > 0) return list;
    return [{ url: '' }];
  }, [product.images]);

  // Diaporama automatique (Changement des images une par une toutes les 2.8s)
  useEffect(() => {
    if (allImages.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % allImages.length);
    }, 2800);

    return () => clearInterval(interval);
  }, [allImages.length, isPaused]);

  const currentImageUrl = getProductImageUrl(allImages[currentImgIndex], CARD_IMAGE_WIDTH);

  // Switch vers l'image associée à une couleur si l'utilisateur survole la couleur
  const handleColorHover = (colorName) => {
    const foundIndex = allImages.findIndex(
      (img) => img.color && img.color.toLowerCase() === colorName.toLowerCase()
    );
    if (foundIndex >= 0) {
      setCurrentImgIndex(foundIndex);
    }
  };

  return (
    <div
      className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border-2 border-transparent hover:border-blue-500"
      onMouseEnter={() => setIsPaused(false)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Link
        to={`/product/${product._id}`}
        onMouseEnter={handlePrefetch}
        onFocus={handlePrefetch}
        onTouchStart={handlePrefetch}
      >
        {/* Cadre d'image redimensionné (Aspect 3:4 avec hauteur optimale h-80 sm:h-96) */}
        <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-gray-100">
          {!isImageLoaded && (
            <Skeleton className="absolute inset-0 w-full h-full z-10" />
          )}

          <img
            key={currentImageUrl}
            src={currentImageUrl}
            alt={product.name}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            onLoad={() => setIsImageLoaded(true)}
            className={`w-full h-full object-cover object-top transition-opacity duration-700 ease-in-out ${
              isImageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges de statut */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
            {discountPercent ? (
              <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full uppercase shadow-lg">
                -{discountPercent}%
              </span>
            ) : product.isOnSale ? (
              <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full uppercase shadow-lg">
                🔥 PROMO
              </span>
            ) : product.isNewProduct ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full uppercase shadow-lg">
                <SparklesIcon className="h-3 w-3" />
                NOUVEAU
              </span>
            ) : null}
          </div>

          {/* Bouton Favoris */}
          <button
            type="button"
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 z-20"
            aria-label="Ajouter aux favoris"
          >
            <HeartIcon className="h-5 w-5 text-gray-700 hover:text-red-500 transition-colors" />
          </button>

          {/* Indicateurs de diaporama (Petits points bas de l'image si plusieurs photos) */}
          {allImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-xs">
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
                  title={`Voir image ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {!inStock && (
            <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center z-20">
              <span className="text-white font-bold text-lg">RUPTURE DE STOCK</span>
            </div>
          )}
        </div>

        <div className="p-5">
          <h3
            className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors text-base"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {product.name}
          </h3>

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

          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-gray-500">Couleurs:</span>
            {colorItems.length > 0 ? (
              <div className="flex gap-1.5">
                {colorItems.map((c) => {
                  const hex = c.code || colorNameToHex(c.name);
                  return (
                    <span
                      key={c.name}
                      onMouseEnter={() => handleColorHover(c.name)}
                      className="w-5 h-5 rounded-full border-2 border-gray-400 shadow-sm cursor-pointer hover:scale-125 transition-transform"
                      style={{ backgroundColor: hex }}
                      title={`Voir la couleur ${c.name}`}
                    />
                  );
                })}
              </div>
            ) : (
              <span className="text-xs text-gray-400">-</span>
            )}
          </div>

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
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {inStock ? '✓ Disponible' : 'Rupture'}
            </span>
          </div>

          <div className="relative overflow-hidden">
            <span className="inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition-all duration-300 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white cursor-pointer">
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
      </Link>
    </div>
  );
};

export default ProductCard;
