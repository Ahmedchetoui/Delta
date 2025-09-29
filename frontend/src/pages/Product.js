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
  const [showOrderModal, setShowOrderModal] = useState(false);

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

  const handleAddToCart = () => {
    if (!selectedSize && currentProduct.variants?.length > 0) {
      toast.error('Veuillez sélectionner une taille');
      return;
    }

    dispatch(addToCart({
      product: currentProduct._id,
      name: currentProduct.name,
      price: productPrice,
      image: currentProduct.images[0],
      quantity,
      size: selectedSize,
      color: selectedColor
    }));

    // Afficher la modal de confirmation au lieu du toast
    setShowOrderModal(true);
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
    console.log('Tentative de commande rapide...', { fullName, phone, streetAddress });
    
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
                {currentProduct.discount > 0 && currentProduct.originalPrice ? (
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl font-bold text-gray-900">
                      {productPrice} DT
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      {currentProduct.originalPrice} DT
                    </span>
                    <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
                      -{currentProduct.discount}%
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    {productPrice} DT
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

            {/* Informations de livraison selon le design */}
            <div className="bg-white border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Informations de livraison:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Nom complet</label>
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder=""
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Téléphone</label>
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder=""
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-1">Adresse</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder=""
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                />
              </div>
            </div>

            {/* Récapitulatif prix selon le design */}
            <div className="bg-white border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Sous-total:</span>
                <span className="font-semibold text-gray-900">{subtotal.toFixed(2)} DT</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Livraison:</span>
                <span className="font-semibold text-gray-900">{deliveryCost.toFixed(2)} DT</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex items-center justify-between text-lg font-bold">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">{total.toFixed(2)} DT</span>
              </div>
            </div>

            {/* Quantité selon le design */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantité:</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 text-lg font-semibold"
                >
                  -
                </button>
                <span className="w-16 text-center font-medium text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 text-lg font-semibold"
                >
                  +
                </button>
                <span className="ml-4 text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {currentProduct.totalStock} en stock
                </span>
              </div>
            </div>

            {/* Bouton Ajouter au Panier selon le design */}
            <button
              onClick={handleAddToCart}
              disabled={currentProduct.totalStock === 0}
              className="w-full bg-green-700 text-white py-4 px-6 rounded-lg hover:bg-green-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
            >
              <ShoppingCartIcon className="h-6 w-6 mr-2" />
              Ajouter au Panier - {total.toFixed(2)} DT
            </button>

            {/* Formulaire de commande rapide */}
            <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-lg font-semibold text-blue-900">Commande rapide</h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet <span className="text-red-500">*</span>
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
                      Téléphone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+216 XX XXX XXX"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse de livraison <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre adresse complète"
                  />
                </div>

                <button
                  onClick={handleDirectOrder}
                  disabled={isOrdering || currentProduct.totalStock === 0}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isOrdering ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Commande en cours...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Commander maintenant - {total.toFixed(2)} DT
                    </>
                  )}
                </button>
              </div>
            </div>
            
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmation de commande</h2>

              {/* Boutons d'action */}
              <div className="flex space-x-3 mb-6">
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    navigate('/cart');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 transition-colors"
                >
                  Continuer mes achats
                </button>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    handleDirectOrder();
                  }}
                  className="flex-1 bg-green-700 text-white py-2 px-4 rounded hover:bg-green-800 transition-colors"
                >
                  Acheter Maintenant
                </button>
              </div>

              {/* Détails du produit */}
              <div className="flex items-start space-x-4 mb-4">
                <img
                  src={currentProduct.images[0]}
                  alt={currentProduct.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{currentProduct.name}</h3>
                  <p className="text-sm text-gray-600">
                    Découvrez l'élégance intemporelle de la Gandoura Marocaine, un vêtement traditionnel qui allie confort et raffinement.
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span>Taille: {selectedSize || 'L (M)'}</span>
                    <span>Couleur: {selectedColor || 'Blanc/Gris'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{subtotal.toFixed(2)} DT</div>
                </div>
              </div>

              {/* Récapitulatif prix */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Prix unitaire:</span>
                  <span>{productPrice.toFixed(2)} DT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Quantité:</span>
                  <span>{quantity}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{total.toFixed(2)} DT</span>
                </div>
              </div>

              {/* Informations de livraison */}
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <h4 className="font-semibold text-gray-900 mb-2">Informations de livraison</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Nom:</strong> {fullName || 'Non renseigné'}</div>
                  <div><strong>Téléphone:</strong> {phone || 'Non renseigné'}</div>
                  <div><strong>Adresse:</strong> {streetAddress || 'Non renseigné'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

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
