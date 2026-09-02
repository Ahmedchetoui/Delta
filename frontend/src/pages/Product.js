import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProduct } from '../store/slices/productSlice';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import Loading from '../components/ui/Loading';
import { toast } from 'react-toastify';
import api from '../services/api';
import { normalizeProductColors, colorNameToHex } from '../utils/colorUtils';
import { PLACEHOLDER_IMAGE } from '../utils/imageUtils';
import {
  getImagesForColor,
  getProductImageUrl,
} from '../utils/productImages';
import {
  colorsEqual,
  getAvailableColors,
  getAvailableColorsForSize,
  getProductSizes,
  isColorAvailableForSize,
  productHasStock,
  sizeHasAvailableStock,
  sizesEqual,
} from '../utils/productStock';
import {
  DEFAULT_CITY,
  DEFAULT_GOVERNORATE,
  TUNISIA_GOVERNORATES,
} from '../constants/tunisiaGovernorates';
import { calculateShippingCost } from '../constants/shipping';
import ProductReviews from '../components/product/ProductReviews';
import { trackViewContent, trackAddToCart, trackInitiateCheckout, trackPurchase } from '../utils/metaPixel';


const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentProduct, isLoading, isRefreshing } = useSelector((state) => state.products);
  const [selectedImage, setSelectedImage] = useState(0);
  const [autoPlayPaused, setAutoPlayPaused] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState(['']);
  const [selectedColors, setSelectedColors] = useState(['']);
  const [quantity, setQuantity] = useState(1);
  const [catalogVersion, setCatalogVersion] = useState(0);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  // Champs d'informations de livraison
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState(DEFAULT_GOVERNORATE);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [streetAddress, setStreetAddress] = useState('');


  const deliveryCost = calculateShippingCost();
  const productPrice = currentProduct
    ? (currentProduct.finalPrice ?? currentProduct.price ?? 0)
    : 0;
  const subtotal = productPrice * quantity;
  const total = subtotal + deliveryCost;

  const displayColors = useMemo(() => {
    if (!currentProduct) return [];
    return normalizeProductColors(currentProduct.colors, currentProduct.variants);
  }, [currentProduct]);

  const productSizes = useMemo(
    () => getProductSizes(currentProduct),
    [currentProduct]
  );

  const availableColors = useMemo(
    () => getAvailableColors(displayColors, currentProduct),
    [displayColors, currentProduct]
  );

  const hasVariants = productSizes.length > 0;

  const colorRequired = availableColors.length > 0;

  const activeColorForImage = useMemo(
    () => selectedColors.find((color) => color) || '',
    [selectedColors]
  );

  const galleryImages = useMemo(() => {
    if (!currentProduct) return [];
    return getImagesForColor(currentProduct.images, activeColorForImage);
  }, [currentProduct, activeColorForImage]);

  useEffect(() => {
    setSelectedImage(0);
  }, [activeColorForImage, galleryImages.length]);

  useEffect(() => {
    if (galleryImages.length <= 1 || autoPlayPaused) return undefined;

    const timer = setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % galleryImages.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [galleryImages.length, autoPlayPaused]);

  const handleThumbnailClick = (index) => {
    setSelectedImage(index);
    setAutoPlayPaused(true);
    window.setTimeout(() => setAutoPlayPaused(false), 12000);
  };

  const setColorAtIndex = (index, colorName) => {
    setSelectedColors((prev) => {
      const next = [...prev];
      next[index] = colorName;
      return next;
    });
    if (index === 0 || !selectedColors[0]) {
      setAutoPlayPaused(false);
    }
  };
  const setSizeAtIndex = (index, sizeName) => {
    setSelectedSizes((prev) => {
      const next = [...prev];
      next[index] = sizeName;
      return next;
    });
  };

  // Auto-select size if only 1 size is available for the product
  useEffect(() => {
    if (!currentProduct || productSizes.length !== 1) return;
    const onlySize = productSizes[0];
    if (!sizeHasAvailableStock(currentProduct, onlySize)) return;

    setSelectedSizes((prev) => {
      let changed = false;
      const next = prev.map((s) => {
        if (!s) {
          changed = true;
          return onlySize;
        }
        return s;
      });
      return changed ? next : prev;
    });
  }, [currentProduct, productSizes]);

  useEffect(() => {
    setSelectedSizes((prev) => {
      if (quantity > prev.length) {
        const defaultSize = prev[0] || '';
        return [...prev, ...Array(quantity - prev.length).fill(defaultSize)];
      }
      return prev.slice(0, quantity);
    });
    setSelectedColors((prev) => {
      if (quantity > prev.length) {
        const defaultColor = prev[0] || '';
        return [...prev, ...Array(quantity - prev.length).fill(defaultColor)];
      }
      return prev.slice(0, quantity);
    });
  }, [quantity]);

  // Reset color of an article if it becomes unavailable for the new selected size of that article
  useEffect(() => {
    if (!currentProduct) return;
    setSelectedColors((prev) => {
      let changed = false;
      const next = prev.map((color, idx) => {
        const size = selectedSizes[idx];
        if (!color) return color;

        const isAvailableForProduct = availableColors.some((c) =>
          colorsEqual(c.name, color)
        );
        if (!isAvailableForProduct) {
          changed = true;
          return '';
        }

        if (!size) return color;
        const available = getAvailableColorsForSize(availableColors, currentProduct, size);
        const isStillAvailable = available.some((c) => colorsEqual(c.name, color));
        if (!isStillAvailable) {
          changed = true;
          return '';
        }
        return color;
      });
      return changed ? next : prev;
    });
  }, [selectedSizes, currentProduct, availableColors]);

  // Automatically select color if only one color is available for the selected size of an article
  useEffect(() => {
    if (!currentProduct || !colorRequired) return;

    setSelectedColors((prevColors) => {
      let changed = false;
      const nextColors = [...prevColors];

      for (let i = 0; i < quantity; i++) {
        const size = selectedSizes[i];
        if (!size) continue;

        const avail = getAvailableColorsForSize(availableColors, currentProduct, size);
        if (avail.length === 1) {
          const onlyColor = avail[0].name;
          if (nextColors[i] !== onlyColor) {
            nextColors[i] = onlyColor;
            changed = true;
          }
        }
      }

      return changed ? nextColors : prevColors;
    });
  }, [selectedSizes, colorRequired, availableColors, currentProduct, quantity]);

  const renderColorSwatches = (selected, onSelect, keyPrefix = '', size = '') => (
    <div className="flex flex-wrap gap-4">
      {availableColors.map((color) => {
        const isSelected = selected === color.name;
        const isDisabled =
          (hasVariants &&
            size &&
            !isColorAvailableForSize(currentProduct, size, color.name));
        const hex = color.code || colorNameToHex(color.name);
        return (
          <div key={`${keyPrefix}${color.name}`} className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => !isDisabled && onSelect(color.name)}
              disabled={isDisabled}
              className={`w-9 h-9 rounded-full border-2 ${
                isSelected ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400' : 'border-gray-300'
              } ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105'}`}
              style={{ backgroundColor: hex }}
              title={color.name}
            />
            <span className={`text-xs mt-1 text-center max-w-[72px] ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
              {color.name}
            </span>
          </div>
        );
      })}
    </div>
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchProduct(id));
    }
  }, [dispatch, id, catalogVersion]);

  useEffect(() => {
    if (currentProduct) {
      trackViewContent(currentProduct);
      document.title = `${currentProduct.name} - Delta Fashion`;
    }
    return () => { document.title = 'Delta Fashion - Votre style, notre passion'; };
  }, [currentProduct]);

  useEffect(() => {
    const refreshProduct = () => setCatalogVersion((version) => version + 1);
    window.addEventListener('delta:catalog-updated', refreshProduct);
    return () => window.removeEventListener('delta:catalog-updated', refreshProduct);
  }, []);

  const validateOrderForm = () => {
    if (!firstName.trim()) {
      toast.error('Veuillez saisir votre prénom');
      return false;
    }
    if (!lastName.trim()) {
      toast.error('Veuillez saisir votre nom');
      return false;
    }
    if (!phone.trim()) {
      toast.error('Veuillez saisir votre numéro de téléphone');
      return false;
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 8) {
      toast.error('Numéro de téléphone invalide (8 chiffres minimum)');
      return false;
    }
    if (!governorate.trim()) {
      toast.error('Veuillez sélectionner un gouvernorat');
      return false;
    }
    if (!city.trim()) {
      toast.error('Veuillez saisir votre ville');
      return false;
    }
    if (!streetAddress.trim()) {
      toast.error('Veuillez saisir votre adresse complète');
      return false;
    }
    if (hasVariants) {
      const sizesForOrder = selectedSizes.slice(0, quantity);
      if (sizesForOrder.length < quantity || sizesForOrder.some((s) => !s)) {
        toast.error(
          quantity === 1
            ? 'Veuillez sélectionner une taille'
            : `Veuillez sélectionner une taille pour chaque article (${quantity} tailles)`
        );
        return false;
      }
    }
    if (colorRequired) {
      const colorsForOrder = selectedColors.slice(0, quantity);
      if (colorsForOrder.length < quantity || colorsForOrder.some((c) => !c)) {
        toast.error(
          quantity === 1
            ? 'Veuillez sélectionner une couleur'
            : `Veuillez sélectionner une couleur pour chaque article (${quantity} couleurs)`
        );
        return false;
      }
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!validateOrderForm()) return;
    trackAddToCart(currentProduct, quantity);
    trackInitiateCheckout([currentProduct], total);
    setShowOrderModal(true);
  };

  const buildOrderItemsFromProduct = () => {
    const itemsGrouped = {};

    for (let i = 0; i < quantity; i++) {
      const size = hasVariants ? (selectedSizes[i] || null) : null;
      const color = colorRequired ? (selectedColors[i] || null) : null;
      const key = `${size || 'no-size'}_${color || 'no-color'}`;

      if (itemsGrouped[key]) {
        itemsGrouped[key].quantity += 1;
      } else {
        itemsGrouped[key] = {
          product: currentProduct._id,
          quantity: 1,
          size,
          color,
        };
      }
    }

    return Object.values(itemsGrouped);
  };

  const handleConfirmOrder = async () => {
    if (!validateOrderForm()) return;

    setIsOrdering(true);

    try {
      const orderData = {
        items: buildOrderItemsFromProduct(),
        shippingAddress: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          street: streetAddress.trim(),
          governorate: governorate.trim(),
          city: city.trim(),
          postalCode: '',
          country: 'Tunisie',
        },
        paymentMethod: 'cash_on_delivery',
      };

      const response = await api.post('/orders', orderData);

      trackPurchase(response.data.order.orderNumber, response.data.order.total || total);

      toast.success('Commande enregistrée avec succès !');
      setShowOrderModal(false);

      navigate('/order-confirmation', {
        state: {
          orderId: response.data.order._id,
          orderNumber: response.data.order.orderNumber,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la commande');
    } finally {
      setIsOrdering(false);
    }
  };




  if (isLoading && !currentProduct) {
    return <Loading size="large" text="Chargement du produit..." />;
  }

  if (!currentProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Produit non trouvé</h1>
          <button
            onClick={() => navigate('/shop')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à la boutique
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-white ${isRefreshing ? 'opacity-95' : ''} transition-opacity duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Breadcrumb amélioré */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm">
            <li><Link to="/" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">Accueil</Link></li>
            <li><span className="text-gray-400">•</span></li>
            <li><Link to="/shop" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">Boutique</Link></li>
            <li><span className="text-gray-400">•</span></li>
            <li><Link to={`/shop?category=${currentProduct.category?._id}`} className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
              {currentProduct.category?.name}
            </Link></li>
            <li><span className="text-gray-400">•</span></li>
            <li className="text-gray-700 font-semibold">{currentProduct.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne gauche: Image principale */}
          <div>
            <div className="aspect-square bg-white rounded-lg shadow-md overflow-hidden relative">
              {galleryImages.length > 1 && (
                <div className="absolute top-3 right-3 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {selectedImage + 1} / {galleryImages.length}
                </div>
              )}
              <img
                src={getProductImageUrl(galleryImages[selectedImage] || galleryImages[0], 720)}
                alt={currentProduct.name}
                loading="eager"
                fetchPriority="high"
                width="600"
                height="600"
                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                className="w-full h-full object-cover transition-opacity duration-500"
              />
            </div>

            {/* Thumbnail Images */}
            {galleryImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image.url}-${index}`}
                    type="button"
                    onClick={() => handleThumbnailClick(index)}
                    className={`aspect-square bg-white rounded-lg shadow-sm overflow-hidden border-2 ${
                      selectedImage === index
                        ? 'border-blue-500'
                        : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={getProductImageUrl(image, 150)}
                      alt={`${currentProduct.name} ${index + 1}`}
                      loading="lazy"
                      width="150"
                      height="150"
                      onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {currentProduct.description}
              </p>
            </div>
          </div>

          {/* Colonne droite: Détails + Commande */}
          <div className="space-y-6">
            {/* Titre et Prix */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {currentProduct.name}
              </h1>

              <div className="text-3xl font-bold mb-6" style={{ color: '#B8860B' }}>
                {productPrice.toFixed(2)} DT
              </div>
            </div>

            {/* Quantité & Options */}
            <div className="space-y-6">
              {/* Quantité */}
              <div className="bg-white border border-gray-300 rounded-lg p-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Quantité</h3>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-6 h-6 border border-gray-400 rounded flex items-center justify-center hover:bg-gray-50 text-sm font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-medium text-sm">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-6 h-6 border border-gray-400 rounded flex items-center justify-center hover:bg-gray-50 text-sm font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {quantity === 1 ? (
                // Mode unitaire simple
                <>
                  {/* Taille */}
                  {hasVariants && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Taille <span className="text-red-500">*</span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {productSizes.map((size) => {
                          const available =
                            sizeHasAvailableStock(currentProduct, size) &&
                            (!selectedColors[0] ||
                              isColorAvailableForSize(currentProduct, size, selectedColors[0]));
                          const isSelected = sizesEqual(selectedSizes[0], size);
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => available && setSizeAtIndex(0, size)}
                              disabled={!available}
                              className={`min-w-10 h-10 px-2 border rounded text-sm font-medium ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                              } ${!available ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Couleur */}
                  {availableColors.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Couleur <span className="text-red-500">*</span>
                      </h3>
                      {renderColorSwatches(
                        selectedColors[0] || '',
                        (name) => setColorAtIndex(0, name),
                        '0-',
                        selectedSizes[0]
                      )}
                    </div>
                  )}
                </>
              ) : (
                // Mode multiple - Taille et couleur répétées par article
                <div className="space-y-4">
                  {Array.from({ length: quantity }, (_, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                      <p className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
                        Article {index + 1}
                      </p>

                      {/* Taille pour l'article */}
                      {hasVariants && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-600 mb-2">
                            Taille <span className="text-red-500">*</span>
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {productSizes.map((size) => {
                              const available =
                                sizeHasAvailableStock(currentProduct, size) &&
                                (!selectedColors[index] ||
                                  isColorAvailableForSize(currentProduct, size, selectedColors[index]));
                              const isSelected = sizesEqual(selectedSizes[index], size);
                              return (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => available && setSizeAtIndex(index, size)}
                                  disabled={!available}
                                  className={`min-w-8 h-8 px-2 border rounded text-xs font-medium ${
                                    isSelected
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                  } ${!available ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {size}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Couleur pour l'article */}
                      {availableColors.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-600 mb-2">
                            Couleur <span className="text-red-500">*</span>
                          </h4>
                          {renderColorSwatches(
                            selectedColors[index] || '',
                            (name) => setColorAtIndex(index, name),
                            `${index}-`,
                            selectedSizes[index]
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Informations de livraison */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium text-blue-900 mb-3">Informations de livraison:</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Prénom"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Nom"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Ex: 22000000"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Gouvernorat <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                  >
                    {TUNISIA_GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Ville <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Votre ville"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Adresse complète <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  rows={2}
                  required
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Rue, numéro, quartier..."
                />
              </div>
            </div>

            {/* Récapitulatif prix */}
            <div className="bg-gray-100 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Sous-total:</span>
                <span className="font-semibold text-gray-900">{subtotal.toFixed(2)} DT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Livraison:</span>
                <span className="font-semibold text-gray-900">{deliveryCost.toFixed(2)} DT</span>
              </div>
              <hr className="border-gray-400 my-2" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">{total.toFixed(2)} DT</span>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!productHasStock(currentProduct)}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <ShoppingCartIcon className="h-5 w-5 mr-2" />
              Commander - {total.toFixed(2)} DT
            </button>

          </div>
        </div>

        {/* Modal de confirmation de commande */}
        {showOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => !isOrdering && setShowOrderModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                disabled={isOrdering}
              >
                ✕
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCartIcon className="w-8 h-8 text-yellow-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Confirmer votre commande</h2>
                <p className="text-gray-600 text-sm">Vérifiez les informations avant de confirmer.</p>
              </div>

              <div className="space-y-3 mb-6 text-sm">
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <p className="font-semibold text-gray-900 mb-1">{currentProduct.name}</p>
                  <p className="text-gray-600">Quantité : {quantity}</p>
                  {Array.from({ length: quantity }, (_, idx) => {
                    const size = selectedSizes[idx];
                    const color = selectedColors[idx];
                    const labels = [];
                    if (size) labels.push(`Taille: ${size}`);
                    if (color) labels.push(`Couleur: ${color}`);
                    if (labels.length === 0) return null;
                    return (
                      <p key={idx} className="text-xs text-gray-500">
                        Article {idx + 1} : {labels.join(' · ')}
                      </p>
                    );
                  })}
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-semibold text-gray-900 mb-1">Livraison</p>
                  <p className="text-gray-600">{firstName} {lastName}</p>
                  <p className="text-gray-600">{phone}</p>
                  <p className="text-gray-600">{streetAddress}</p>
                  <p className="text-gray-600">{city}, {governorate}</p>
                </div>

                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total</span>
                  <span>{total.toFixed(2)} DT</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmOrder}
                  disabled={isOrdering}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                >
                  {isOrdering ? 'Enregistrement...' : `Confirmer la commande - ${total.toFixed(2)} DT`}
                </button>
                <button
                  onClick={() => setShowOrderModal(false)}
                  disabled={isOrdering}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        <ProductReviews
          productId={currentProduct._id}
          reviews={currentProduct.reviews || []}
          rating={currentProduct.rating || { average: 0, count: 0 }}
        />
      </div>
    </div>
  );
};

export default Product;
