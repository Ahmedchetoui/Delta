import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProduct } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import Loading from '../components/ui/Loading';
import { toast } from 'react-toastify';
import { resolveImageUrl } from '../utils/imageUtils';
import { normalizeProductColors, colorNameToHex } from '../utils/colorUtils';
import { variantHasStock, productHasStock } from '../utils/productStock';

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentProduct, loading } = useSelector((state) => state.products);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [showOrderModal, setShowOrderModal] = useState(false);

  // Champs d'informations de livraison
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');


  const deliveryCost = 7.0; // Coût de livraison affiché dans la maquette
  const productPrice = currentProduct ? (currentProduct.price || 0) : 0;
  const subtotal = productPrice * quantity;
  const total = subtotal + deliveryCost;

  const displayColors = useMemo(() => {
    if (!currentProduct) return [];
    return normalizeProductColors(currentProduct.colors, currentProduct.variants);
  }, [currentProduct]);

  const availableColorsForSize = useMemo(() => {
    if (!currentProduct?.variants?.length) return displayColors;
    if (!selectedSize) return displayColors;

    const variantColors = currentProduct.variants
      .filter((v) => v.size === selectedSize && variantHasStock(v))
      .map((v) => v.color)
      .filter(Boolean);

    if (variantColors.length === 0) return displayColors;

    return displayColors.filter((c) => variantColors.includes(c.name));
  }, [currentProduct, selectedSize, displayColors]);

  const colorRequired = displayColors.length > 0;

  useEffect(() => {
    if (selectedColor && !availableColorsForSize.some((c) => c.name === selectedColor)) {
      setSelectedColor('');
    }
  }, [selectedSize, availableColorsForSize, selectedColor]);

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
    if (!selectedSize && currentProduct.variants?.length > 0) {
      toast.error('Veuillez sélectionner une taille');
      return;
    }
    if (colorRequired && !selectedColor) {
      toast.error('Veuillez sélectionner une couleur');
      return;
    }

    try {
      // Ajouter au panier au lieu de créer directement la commande
      const cartItem = {
        product: currentProduct,
        quantity: parseInt(quantity),
        size: selectedSize || null,
        color: selectedColor || null
      };

      // Stocker les informations de livraison pour la confirmation finale
      const guestInfo = {
        fullName: fullName.trim(),
        phone: phone.trim(),
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




  if (loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="aspect-square bg-white rounded-lg shadow-md overflow-hidden">
              <img
                src={resolveImageUrl(currentProduct.images[selectedImage])}
                alt={currentProduct.name}
                loading="eager"
                fetchpriority="high"
                width="600"
                height="600"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            {currentProduct.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {currentProduct.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-white rounded-lg shadow-sm overflow-hidden border-2 ${selectedImage === index
                      ? 'border-blue-500'
                      : 'border-gray-200'
                      }`}
                  >
                    <img
                      src={image}
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
            {currentProduct.variants && currentProduct.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Taille</h3>
                <div className="flex gap-2">
                  {[...new Set(currentProduct.variants.map(v => v.size))].map((size) => {
                    const available = currentProduct.variants.some(
                      (v) => v.size === size && variantHasStock(v)
                    );
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        disabled={!available}
                        className={`w-10 h-10 border rounded text-sm font-medium ${isSelected
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
            {displayColors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Couleur <span className="text-red-500">*</span>
                </h3>
                <div className="flex flex-wrap gap-4">
                  {availableColorsForSize.map((color) => {
                    const isSelected = selectedColor === color.name;
                    const hex = color.code || colorNameToHex(color.name);
                    return (
                      <div key={color.name} className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => setSelectedColor(color.name)}
                          className={`w-9 h-9 rounded-full border-2 ${
                            isSelected ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: hex }}
                          title={color.name}
                        />
                        <span className="text-xs text-gray-600 mt-1 text-center max-w-[72px]">
                          {color.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
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

            {/* Quantité */}
            <div className="bg-white border border-gray-300 rounded-lg p-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Quantité:</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-6 h-6 border border-gray-400 rounded flex items-center justify-center hover:bg-gray-50 text-sm font-bold"
                >
                  -
                </button>
                <span className="w-8 text-center font-medium text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-6 h-6 border border-gray-400 rounded flex items-center justify-center hover:bg-gray-50 text-sm font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Bouton Ajouter au Panier */}
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
                    setSelectedColor('');
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
