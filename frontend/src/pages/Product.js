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

  const [showOrderModal, setShowOrderModal] = useState(false);
  
  // Champs d'informations de livraison
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [preferredColor, setPreferredColor] = useState('');

  const deliveryCost = 7.0; // Coût de livraison affiché dans la maquette
  const productPrice = currentProduct ? (currentProduct.price || 0) : 0;
  const subtotal = productPrice * quantity;
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
          color: selectedColor || preferredColor || null
        }],
        shippingAddress: {
          firstName: firstName,
          lastName: lastName,
          email: `guest_${Date.now()}@deltafashion.tn`,
          phone: phone,
          street: streetAddress,
          city: 'Tunisie',
          postalCode: '',
          country: 'Tunisie'
        },
        paymentMethod: 'cash_on_delivery'
      };

      // Envoyer la commande
      const response = await api.post('/orders', orderData);
      
      toast.success('Commande passée avec succès !');
      
      // Afficher la modal de confirmation
      setShowOrderModal(true);

    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la commande');
    }
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
                src={currentProduct.images[selectedImage] || '/api/placeholder/600/600'}
                alt={currentProduct.name}
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
                    className={`aspect-square bg-white rounded-lg shadow-sm overflow-hidden border-2 ${
                      selectedImage === index 
                        ? 'border-blue-500' 
                        : 'border-gray-200'
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
              
              <div className="text-3xl font-bold text-orange-500 mb-6">
                {productPrice.toFixed(2)} DT
              </div>
            </div>

            {/* Taille */}
            {currentProduct.variants && currentProduct.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Taille</h3>
                <div className="flex gap-2">
                  {[...new Set(currentProduct.variants.map(v => v.size))].map((size) => {
                    const available = currentProduct.variants.some(v => v.size === size && (v.stock ?? 0) > 0);
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        disabled={!available}
                        className={`w-10 h-10 border rounded text-sm font-medium ${
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
            {currentProduct.variants && currentProduct.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Couleur</h3>
                <div className="flex gap-3">
                  {[...new Set(currentProduct.variants.map(v => v.color))].map((color) => {
                    const isSelected = selectedColor === color;
                    const hex = colorNameToHex(color);
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          isSelected ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: hex }}
                        title={color}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Informations de livraison */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Informations de livraison:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre nom complet"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 22000000"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <textarea
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre adresse complète"
                />
              </div>
            </div>

            {/* Récapitulatif prix */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sous-total:</span>
                <span className="font-semibold">{subtotal.toFixed(2)} DT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Livraison:</span>
                <span className="font-semibold">{deliveryCost.toFixed(2)} DT</span>
              </div>
              <hr className="border-gray-300" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{total.toFixed(2)} DT</span>
              </div>
            </div>

            {/* Quantité */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Quantité:</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 text-lg font-semibold"
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 text-lg font-semibold"
                >
                  +
                </button>
                <span className="ml-4 text-sm text-gray-600">
                  {currentProduct.totalStock} en stock
                </span>
              </div>
            </div>

            {/* Bouton Ajouter au Panier */}
            <button
              onClick={handleAddToCart}
              disabled={currentProduct.totalStock === 0}
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
                <h2 className="text-xl font-bold text-gray-900 mb-2">Commande confirmée !</h2>
                <p className="text-gray-600">Votre commande a été passée avec succès.</p>
              </div>

              {/* Bouton fermer */}
              <div className="text-center">
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
