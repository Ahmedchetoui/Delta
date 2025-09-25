import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProduct } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import { HeartIcon, ShoppingCartIcon, StarIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import Loading from '../components/ui/Loading';
import { toast } from 'react-toastify';
import api from '../services/api';

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentProduct, loading } = useSelector((state) => state.products);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Champs de commande rapide (interface client comme la capture)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);

  const deliveryCost = 7.0; // Coût de livraison affiché dans la maquette
  const subtotal = currentProduct ? (currentProduct.finalPrice * quantity) : 0;
  const total = subtotal + deliveryCost;

  // Helpers d'affichage couleurs (approximation pour swatches)
  const colorNameToHex = (name) => {
    const key = (name || '').toLowerCase();
    const map = {
      'noir': '#111827',
      'black': '#111827',
      'blanc': '#ffffff',
      'white': '#ffffff',
      'gris': '#9ca3af',
      'grège': '#d9cdbf',
      'kaki': '#786f52',
      'vert': '#22c55e',
      'jaune': '#eab308',
      'bleu': '#2563eb',
      'marine': '#1e3a8a',
      'rouge': '#ef4444',
      'marron': '#92400e',
      'beige': '#e7dac7',
    };
    // quelques combinaisons fréquentes
    if (key.includes('bleu') && key.includes('marine')) return '#1e3a8a';
    if (key.includes('blanc') && key.includes('gris')) return '#d1d5db';
    if (key.includes('jaune') && key.includes('vert')) return '#a3b18a';
    // fallback: cherche un mot connu
    for (const k of Object.keys(map)) {
      if (key.includes(k)) return map[k];
    }
    return '#9ca3af';
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchProduct(id));
    }
  }, [dispatch, id]);

  const handleAddToCart = () => {
    if (!selectedSize && currentProduct.variants?.length > 0) {
      toast.error('Veuillez sélectionner une taille');
      return;
    }

    dispatch(addToCart({
      product: currentProduct._id,
      name: currentProduct.name,
      price: currentProduct.finalPrice,
      image: currentProduct.images[0],
      quantity,
      size: selectedSize,
      color: selectedColor
    }));

    toast.success('Produit ajouté au panier !');
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.info(isWishlisted ? 'Retiré de la wishlist' : 'Ajouté à la wishlist');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentProduct.name,
        text: currentProduct.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié dans le presse-papiers !');
    }
  };

  const handleDirectOrder = async () => {
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

    // Validation du stock
    if (currentProduct.totalStock === 0) {
      toast.error('Ce produit n\'est plus en stock');
      return;
    }

    // Validation de la taille si nécessaire
    if (!selectedSize && currentProduct.variants?.length > 0) {
      toast.error('Veuillez sélectionner une taille');
      return;
    }

    setIsOrdering(true);

    try {
      // Séparer le nom complet en prénom et nom
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || firstName;

      // Préparer les données de commande
      const orderData = {
        items: [{
          product: currentProduct._id,
          quantity: quantity,
          size: selectedSize || null,
          color: selectedColor || null
        }],
        shippingAddress: {
          firstName: firstName,
          lastName: lastName,
          email: `guest_${Date.now()}@deltafashion.tn`, // Email temporaire pour les invités
          phone: phone,
          street: streetAddress,
          city: 'Tunisie', // Valeur par défaut
          postalCode: '',
          country: 'Tunisie'
        },
        paymentMethod: 'cash_on_delivery'
      };

      // Envoyer la commande
      const response = await api.post('/orders', orderData);
      
      toast.success('Commande passée avec succès !');
      
      // Rediriger vers une page de confirmation
      navigate('/order-confirmation', { 
        state: { 
          orderId: response.data.order._id,
          orderNumber: response.data.order.orderNumber 
        } 
      });

    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la commande');
    } finally {
      setIsOrdering(false);
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><a href="/" className="hover:text-blue-600">Accueil</a></li>
            <li>/</li>
            <li><a href="/shop" className="hover:text-blue-600">Boutique</a></li>
            <li>/</li>
            <li><a href={`/shop?category=${currentProduct.category?._id}`} className="hover:text-blue-600">
              {currentProduct.category?.name}
            </a></li>
            <li>/</li>
            <li className="text-gray-900">{currentProduct.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Colonne gauche: Images + Description */}
          <div>
            <div className="aspect-square bg-white rounded-lg shadow-md overflow-hidden mb-4">
              <img
                src={currentProduct.images[selectedImage] || '/api/placeholder/600/600'}
                alt={currentProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Thumbnail Images */}
            {currentProduct.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {currentProduct.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-white rounded-lg shadow-sm overflow-hidden border-2 ${
                      selectedImage === index ? 'border-blue-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${currentProduct.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Description (en bas, comme la maquette) */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {currentProduct.description}
              </p>
            </div>
          </div>

          {/* Colonne droite: Détails + Commande */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {currentProduct.name}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(currentProduct.rating || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  ({currentProduct.reviews?.length || 0} avis)
                </span>
              </div>

              {/* Price */}
              <div className="mb-6">
                {currentProduct.isOnSale && currentProduct.price !== currentProduct.finalPrice ? (
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl font-bold text-gray-900">
                      {currentProduct.finalPrice} DT
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      {currentProduct.price} DT
                    </span>
                    <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
                      -{Math.round((1 - currentProduct.finalPrice / currentProduct.price) * 100)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    {currentProduct.finalPrice} DT
                  </span>
                )}
              </div>
            </div>

            {/* Variants */}
            {currentProduct.variants && currentProduct.variants.length > 0 && (
              <div className="space-y-4">
                {/* Sizes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Taille</h3>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(currentProduct.variants.map(v => v.size))].map((size) => {
                      const available = currentProduct.variants.some(v => v.size === size && (v.stock ?? 0) > 0);
                      const isSelected = selectedSize === size;
                      return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                          disabled={!available}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                            isSelected
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-white text-gray-800 border-gray-300 hover:border-green-500'
                          } ${!available ? 'opacity-50 cursor-not-allowed line-through' : ''}`}
                      >
                        {size}
                      </button>
                      );
                    })}
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Couleur</h3>
                  <div className="flex flex-wrap items-start gap-4">
                    {[...new Set(currentProduct.variants.map(v => v.color))].map((color) => {
                      const isSelected = selectedColor === color;
                      const hex = colorNameToHex(color);
                      return (
                        <div key={color} className="flex flex-col items-center">
                      <button
                        onClick={() => setSelectedColor(color)}
                            className={`w-8 h-8 rounded-full border-2 ${isSelected ? 'border-green-600 ring-2 ring-green-600/20' : 'border-gray-300'} transition-shadow`}
                            style={{ backgroundColor: hex }}
                            aria-label={color}
                            title={color}
                          />
                          <span className="text-xs text-gray-600 mt-1 max-w-[72px] text-center leading-tight">
                        {color}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Quantité */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quantité</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-16 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Stock Status */}
            <div>
              {currentProduct.totalStock > 0 ? (
                <p className="text-green-600 font-medium">
                  ✓ En stock ({currentProduct.totalStock} disponibles)
                </p>
              ) : (
                <p className="text-red-600 font-medium">
                  ✗ Rupture de stock
                </p>
              )}
            </div>

            {/* Formulaire de commande rapide */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-sm font-semibold text-blue-900">Commande rapide - Remplissez vos informations:</h3>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-1">Nom complet *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre nom complet"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Téléphone *</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: +216 XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Adresse *</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre adresse complète"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <p className="text-xs text-gray-600">
                * Champs obligatoires pour la commande rapide
              </p>
            </div>

            {/* Carte récapitulatif prix (pleine largeur sous les champs) */}
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
              <div className="divide-y">
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-gray-700">Sous-total:</span>
                  <span className="font-semibold text-gray-900">{subtotal.toFixed(2)} DT</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-gray-700">Livraison:</span>
                  <span className="font-semibold text-gray-900">{deliveryCost.toFixed(2)} DT</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-gray-900 font-semibold">Total:</span>
                  <span className="text-gray-900 font-bold">{total.toFixed(2)} DT</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center text-sm ${currentProduct.totalStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentProduct.totalStock > 0 ? '✓ En stock' : '✗ Rupture de stock'}
              </span>
            </div>

                <button
                  onClick={handleAddToCart}
                  disabled={currentProduct.totalStock === 0}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-3"
                >
              <ShoppingCartIcon className="h-5 w-5 mr-2" />
              Ajouter au Panier – {subtotal.toFixed(2)} DT
                </button>

                <button
                  onClick={handleDirectOrder}
                  disabled={currentProduct.totalStock === 0 || isOrdering}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isOrdering ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Commande en cours...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Commander maintenant – {total.toFixed(2)} DT
                    </>
                  )}
                </button>
                
            <div className="flex space-x-3">
                <button
                  onClick={handleWishlist}
                className="flex-1 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  {isWishlisted ? (
                    <HeartSolidIcon className="h-6 w-6 text-red-500" />
                  ) : (
                    <HeartIcon className="h-6 w-6 text-gray-600" />
                  )}
                </button>
                <button
                  onClick={handleShare}
                className="flex-1 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  <ShareIcon className="h-6 w-6 text-gray-600" />
                </button>
              </div>
              
            
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Avis clients</h2>
          <div className="bg-white rounded-lg shadow-md p-8">
            <p className="text-gray-600 text-center">
              Section des avis à implémenter...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product;
