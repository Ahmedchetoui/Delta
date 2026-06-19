import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProduct } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import Loading from '../components/ui/Loading';
import { toast } from 'react-toastify';
import { normalizeProductColors, colorNameToHex } from '../utils/colorUtils';
import {
  getImagesForColor,
  getProductImageUrl,
} from '../utils/productImages';
import {
  colorsEqual,
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

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentProduct, isLoading, isRefreshing } = useSelector((state) => state.products);
  const [selectedImage, setSelectedImage] = useState(0);
  const [autoPlayPaused, setAutoPlayPaused] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColors, setSelectedColors] = useState(['']);
  const [quantity, setQuantity] = useState(1);

  const [showOrderModal, setShowOrderModal] = useState(false);

  // Champs d'informations de livraison
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState(DEFAULT_GOVERNORATE);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [streetAddress, setStreetAddress] = useState('');


  const deliveryCost = 7.0; // Coût de livraison affiché dans la maquette
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

  const hasVariants = productSizes.length > 0;

  const availableColorsForSize = useMemo(
    () => getAvailableColorsForSize(displayColors, currentProduct, selectedSize),
    [displayColors, currentProduct, selectedSize]
  );

  const colorRequired = displayColors.length > 0;

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
  useEffect(() => {
    setSelectedColors((prev) => {
      if (quantity > prev.length) {
        return [...prev, ...Array(quantity - prev.length).fill('')];
      }
      return prev.slice(0, quantity);
    });
  }, [quantity]);

  useEffect(() => {
    setSelectedColors((prev) =>
      prev.map((color) =>
        color && availableColorsForSize.some((c) => colorsEqual(c.name, color))
          ? color
          : ''
      )
    );
  }, [selectedSize, availableColorsForSize]);

  useEffect(() => {
    if (!selectedSize || !colorRequired || availableColorsForSize.length !== 1) return;

    const onlyColor = availableColorsForSize[0].name;
    setSelectedColors((prev) =>
      Array.from({ length: quantity }, (_, index) => prev[index] || onlyColor)
    );
  }, [selectedSize, colorRequired, availableColorsForSize, quantity]);

  const renderColorSwatches = (selected, onSelect, keyPrefix = '', allowPick = true) => (
    <div className="flex flex-wrap gap-4">
      {displayColors.map((color) => {
        const isSelected = selected === color.name;
        const isDisabled =
          !allowPick ||
          (hasVariants &&
            selectedSize &&
            !isColorAvailableForSize(currentProduct, selectedSize, color.name));
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
  }, [dispatch, id]);

  const handleAddToCart = async () => {
    // Validation des champs obligatoires
    if (!fullName.trim()) {
      toast.error('Veuillez saisir votre nom complet');
      return;
    }
    if (!phone.trim()) {
      toast.error('Veuillez saisir votre numéro de téléphone');
      return;
    }
    if (!streetAddress.trim()) {
      toast.error('Veuillez saisir votre adresse');
      return;
    }
    if (!city.trim()) {
      toast.error('Veuillez saisir votre ville');
      return;
    }
    if (hasVariants && !selectedSize) {
      toast.error('Veuillez sélectionner une taille');
      return;
    }
    if (colorRequired) {
      const colorsForOrder = selectedColors.slice(0, quantity);
      if (colorsForOrder.length < quantity || colorsForOrder.some((c) => !c)) {
        toast.error(
          quantity === 1
            ? 'Veuillez sélectionner une couleur'
            : `Veuillez sélectionner une couleur pour chaque article (${quantity} couleurs)`
        );
        return;
      }
    }

    try {
      const colorsForCart = colorRequired ? selectedColors.slice(0, quantity) : [];
      const cartItem = {
        product: currentProduct,
        quantity: parseInt(quantity, 10),
        size: selectedSize || null,
        colors: colorsForCart,
        color: colorsForCart[0] || null,
      };

      // Stocker les informations de livraison pour la confirmation finale
      const guestInfo = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        governorate: governorate.trim(),
        city: city.trim(),
        streetAddress: streetAddress.trim()
      };

      // Sauvegarder les infos invité dans le localStorage
      localStorage.setItem('guestOrderInfo', JSON.stringify(guestInfo));

      // Ajouter au panier
      dispatch(addToCart(cartItem));

      toast.success('Produit ajouté au panier !');

      // Afficher la modal de confirmation
      setShowOrderModal(true);

    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
      toast.error('Erreur lors de l\'ajout au panier');
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
            <li><a href="/" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">Accueil</a></li>
            <li><span className="text-gray-400">•</span></li>
            <li><a href="/shop" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">Boutique</a></li>
            <li><span className="text-gray-400">•</span></li>
            <li><a href={`/shop?category=${currentProduct.category?._id}`} className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
              {currentProduct.category?.name}
            </a></li>
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

            {/* Taille */}
            {hasVariants && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Taille <span className="text-red-500">*</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {productSizes.map((size) => {
                    const available = sizeHasAvailableStock(currentProduct, size);
                    const isSelected = sizesEqual(selectedSize, size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => available && setSelectedSize(size)}
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

            {/* Quantité */}
            <div className="bg-white border border-gray-300 rounded-lg p-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Quantité:</h3>
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

            {/* Couleur(s) — une par article */}
            {displayColors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {quantity === 1 ? 'Couleur' : 'Couleurs'}{' '}
                  <span className="text-red-500">*</span>
                  {quantity > 1 && (
                    <span className="text-gray-500 font-normal text-xs ml-1">
                      (1 couleur par article)
                    </span>
                  )}
                </h3>
                {hasVariants && !selectedSize ? (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Veuillez d&apos;abord choisir une taille pour sélectionner les couleurs disponibles.
                  </p>
                ) : quantity === 1 ? (
                  renderColorSwatches(
                    selectedColors[0] || '',
                    (name) => setColorAtIndex(0, name),
                    '',
                    Boolean(selectedSize || !hasVariants)
                  )
                ) : (
                  <div className="space-y-4">
                    {Array.from({ length: quantity }, (_, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <p className="text-xs font-medium text-gray-600 mb-2">
                          Article {index + 1}
                        </p>
                        {renderColorSwatches(
                          selectedColors[index] || '',
                          (name) => setColorAtIndex(index, name),
                          `${index}-`,
                          Boolean(selectedSize || !hasVariants)
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Informations de livraison */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium text-blue-900 mb-3">Informations de livraison:</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Nom complet:
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Votre nom complet"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Téléphone:
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Ex: 22000000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Gouvernorat:
                  </label>
                  <select
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                  >
                    {TUNISIA_GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Ville:
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Ex: Manze ennour"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Adresse:
                </label>
                <textarea
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Votre adresse complète"
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
              Ajouter au Panier - {total.toFixed(2)} DT
            </button>

          </div>
        </div>

        {/* Modal de confirmation de commande */}
        {showOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
              {/* Bouton fermer */}
              <button
                onClick={() => setShowOrderModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>

              {/* Titre */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Produit ajouté au panier !</h2>
                <p className="text-gray-600">Votre produit a été ajouté au panier pour confirmation finale.</p>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    navigate('/cart');
                  }}
                  className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Voir le panier
                </button>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    // Réinitialiser le formulaire
                    setFullName('');
                    setPhone('');
                    setStreetAddress('');
                    setSelectedSize('');
                    setSelectedColors(['']);
                    setQuantity(1);
                  }}
                  className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continuer mes achats
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Avis clients */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Avis clients</h2>
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-500 italic">Section des avis à implémenter...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product;
