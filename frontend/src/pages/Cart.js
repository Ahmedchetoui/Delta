import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { removeFromCart, updateCartItemQuantity, clearCart, selectCartItems, selectCartTotal } from '../store/slices/cartSlice';
import { ShoppingCartIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import api from '../services/api';
import { getImagesForColor, getProductImageUrl } from '../utils/productImages';
import { expandCartItemForOrder, formatColorsLabel, normalizeCartColors } from '../utils/cartColors';
import {
  DEFAULT_CITY,
  DEFAULT_GOVERNORATE,
} from '../constants/tunisiaGovernorates';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectCartItems);
  const totalAmount = useSelector(selectCartTotal);

  // États pour les informations de livraison
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState(DEFAULT_GOVERNORATE);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [address, setAddress] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Charger les informations invité au chargement de la page
  useEffect(() => {
    const guestInfo = localStorage.getItem('guestOrderInfo');
    if (guestInfo) {
      try {
        const parsedInfo = JSON.parse(guestInfo);
        setFullName(parsedInfo.fullName || '');
        setPhone(parsedInfo.phone || '');
        setGovernorate(parsedInfo.governorate || DEFAULT_GOVERNORATE);
        setCity(parsedInfo.city || DEFAULT_CITY);
        setAddress(parsedInfo.streetAddress || '');
      } catch (error) {
        console.error('Erreur lors du chargement des informations invité:', error);
      }
    }
  }, []);

  const deliveryCost = 8.0;
  const total = totalAmount + deliveryCost;

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      dispatch(removeFromCart(itemId));
      toast.success('Produit retiré du panier');
    } else {
      dispatch(updateCartItemQuantity({ itemId, quantity: newQuantity }));
    }
  };



  const handleClearCart = () => {
    dispatch(clearCart());
    toast.success('Panier vidé');
  };

  const handleCancelOrder = () => {
    dispatch(clearCart());
    localStorage.removeItem('guestOrderInfo');
    toast.success('Commande annulée');
    setShowCancelModal(false);
  };

  const handleDirectOrder = async () => {
    if (!fullName.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      toast.error('Veuillez remplir toutes les informations de livraison');
      return;
    }

    setIsOrdering(true);

    try {
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || firstName;

      const orderData = {
        items: items.flatMap((item) => expandCartItemForOrder(item)),
        shippingAddress: {
          firstName: firstName,
          lastName: lastName,
          email: `guest_${Date.now()}@deltafashion.tn`,
          phone: phone,
          street: address,
          governorate: governorate,
          city: city,
          postalCode: '',
          country: 'Tunisie'
        },
        paymentMethod: 'cash_on_delivery'
      };

      const response = await api.post('/orders', orderData);

      toast.success('Commande passée avec succès !');
      dispatch(clearCart());

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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingCartIcon className="mx-auto h-24 w-24 text-gray-400 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Votre panier est vide
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Découvrez nos produits et ajoutez-les à votre panier
            </p>
            <Link
              to="/shop"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Commencer mes achats
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Informations de livraison selon l'image 3 */}
        <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de livraison:</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom:</label>
              <div className="text-right text-gray-900 font-medium">{fullName}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone:</label>
              <div className="text-right text-gray-900 font-medium">{phone}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gouvernorat:</label>
              <div className="text-right text-gray-900 font-medium">{governorate}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville:</label>
              <div className="text-right text-gray-900 font-medium">{city}</div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse:</label>
              <div className="text-right text-gray-900 font-medium">{address}</div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                // Permettre la modification des informations
                const newName = prompt('Modifier le nom:', fullName);
                if (newName) setFullName(newName);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
            >
              📝 Modifier
            </button>
            <button
              onClick={handleClearCart}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm"
            >
              🗑️ Effacer
            </button>
          </div>
        </div>

        {/* Récapitulatif des prix selon l'image 3 */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Sous-total:</span>
              <span className="font-semibold text-gray-900">{totalAmount.toFixed(2)} DT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Livraison:</span>
              <span className="font-semibold text-gray-900">{deliveryCost.toFixed(2)} DT</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between text-lg font-bold">
              <span className="text-gray-900">Total:</span>
              <span className="text-gray-900">{total.toFixed(2)} DT</span>
            </div>
          </div>
        </div>

        {/* Quantité selon l'image 3 */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Quantité:</h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                if (items.length > 0) {
                  handleQuantityChange(items[0].id, Math.max(1, items[0].quantity - 1));
                }
              }}
              className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 text-lg font-semibold"
            >
              -
            </button>
            <span className="w-16 text-center font-medium text-lg">
              {items.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
            <button
              onClick={() => {
                if (items.length > 0) {
                  handleQuantityChange(items[0].id, items[0].quantity + 1);
                }
              }}
              className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 text-lg font-semibold"
            >
              +
            </button>
          </div>
        </div>

        {/* Section de confirmation finale */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Confirmation finale</h3>
              <p className="text-yellow-700 text-sm mb-3">
                Vérifiez vos informations avant de confirmer votre commande.
                Vous pouvez encore modifier ou annuler votre commande.
              </p>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={handleDirectOrder}
            disabled={isOrdering || items.length === 0}
            className="flex-1 bg-green-700 text-white py-4 px-6 rounded-lg hover:bg-green-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
          >
            {isOrdering ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                Commande en cours...
              </>
            ) : (
              <>
                <ShoppingCartIcon className="h-6 w-6 mr-2" />
                Confirmer la commande - {total.toFixed(2)} DT
              </>
            )}
          </button>

          <button
            onClick={() => setShowCancelModal(true)}
            disabled={isOrdering}
            className="flex-1 bg-red-600 text-white py-4 px-6 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
          >
            <TrashIcon className="h-6 w-6 mr-2" />
            Annuler la commande
          </button>
        </div>

        {/* Articles du panier (version simplifiée) */}
        {items.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Articles dans votre panier:</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center space-x-3">
                    <img
                      src={getProductImageUrl(
                        getImagesForColor(
                          item.product?.images,
                          normalizeCartColors(item)[0]
                        )[0] || item.product?.images?.[0]
                      )}
                      alt={item.product?.name}
                      loading="lazy"
                      width="50"
                      height="50"
                      className="h-12 w-12 object-cover rounded"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{item.product?.name}</div>
                      <div className="text-sm text-gray-500">
                        {item.size && `Taille: ${item.size}`}
                        {normalizeCartColors(item).length > 0 && (
                          <span>
                            {item.size ? ' · ' : ''}
                            Couleur{item.quantity > 1 ? 's' : ''}: {formatColorsLabel(normalizeCartColors(item))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {(item.price * item.quantity).toFixed(2)} DT
                    </div>
                    <div className="text-sm text-gray-500">Qté: {item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de confirmation d'annulation */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="text-center mb-6">
                <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Annuler la commande ?</h2>
                <p className="text-gray-600">
                  Êtes-vous sûr de vouloir annuler votre commande ?
                  Tous les articles seront supprimés du panier et vos informations seront effacées.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Garder ma commande
                </button>
                <button
                  onClick={handleCancelOrder}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Oui, annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
