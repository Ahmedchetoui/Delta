import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCartItems, selectCartTotal } from '../store/slices/cartSlice';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import {
  DEFAULT_CITY,
  DEFAULT_GOVERNORATE,
  TUNISIA_GOVERNORATES,
} from '../constants/tunisiaGovernorates';
import { getImagesForColor, getProductImageUrl } from '../utils/productImages';
import { normalizeCartColors } from '../utils/cartColors';
import { calculateShippingCost } from '../constants/shipping';

const Checkout = () => {
  const navigate = useNavigate();
  const items = useSelector(selectCartItems);
  const totalAmount = useSelector(selectCartTotal);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    governorate: DEFAULT_GOVERNORATE,
    city: DEFAULT_CITY,
    address: '',
    paymentMethod: 'cash_on_delivery'
  });

  // Charger les informations invité au chargement de la page
  useEffect(() => {
    const guestInfo = localStorage.getItem('guestOrderInfo');
    if (guestInfo) {
      try {
        const parsedInfo = JSON.parse(guestInfo);
        const legacyName = String(parsedInfo.fullName || '').trim();
        const legacyParts = legacyName ? legacyName.split(' ') : [];
        setFormData(prev => ({
          ...prev,
          firstName: parsedInfo.firstName || legacyParts[0] || '',
          lastName: parsedInfo.lastName || legacyParts.slice(1).join(' ') || '',
          phone: parsedInfo.phone || '',
          governorate: parsedInfo.governorate || DEFAULT_GOVERNORATE,
          city: parsedInfo.city || DEFAULT_CITY,
          address: parsedInfo.streetAddress || parsedInfo.address || ''
        }));
      } catch (error) {
        console.error('Erreur lors du chargement des informations invité:', error);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.address || !formData.city) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 8) {
      toast.error('Numéro de téléphone invalide (8 chiffres minimum)');
      return;
    }

    if (items.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        items: items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          size: item.size || null,
          color: item.color || null
        })),
        shippingAddress: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone,
          street: formData.address,
          governorate: formData.governorate,
          city: formData.city,
          postalCode: '',
          country: 'Tunisie'
        },
        paymentMethod: formData.paymentMethod
      };

      // Envoyer la commande
      const response = await api.post('/orders', orderData);
      
      toast.success('Commande passée avec succès !');
      
      // Sauvegarder les informations de commande en localStorage pour suivi
      const orderInfo = {
        orderNumber: response.data.order.orderNumber,
        orderId: response.data.order._id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        total: response.data.order.total,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('lastGuestOrder', JSON.stringify(orderInfo));
      localStorage.setItem('guestOrderInfo', JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        governorate: formData.governorate,
        city: formData.city,
        streetAddress: formData.address,
        address: formData.address,
      }));
      
      navigate('/order-confirmation', { 
        state: { 
          orderId: response.data.order._id,
          orderNumber: response.data.order.orderNumber,
          phone: formData.phone
        } 
      });

    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la commande');
    } finally {
      setIsSubmitting(false);
    }
  };

  const shippingCost = calculateShippingCost();
  const finalTotal = totalAmount + shippingCost;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finaliser la commande</h1>
          <p className="text-gray-600">
            Vous pouvez commander sans créer de compte. 
            <Link to="/guest-order-tracking" className="text-blue-600 hover:text-blue-800 ml-1">
              Suivre une commande existante
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Adresse de livraison</h2>
                <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  ✓ Commande sans inscription
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Commande simplifiée</h3>
                    <div className="mt-1 text-sm text-blue-700">
                      <p>Remplissez simplement les informations essentielles pour passer votre commande.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Prénom"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Nom"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de téléphone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Ex: +216 XX XXX XXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Nécessaire pour suivre votre commande</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gouvernorat *
                    </label>
                    <select
                      name="governorate"
                      required
                      value={formData.governorate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {TUNISIA_GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ville *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Votre ville"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse de livraison *
                  </label>
                  <textarea
                    name="address"
                    rows={3}
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Adresse complète de livraison"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Paiement à la livraison uniquement */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Mode de paiement</h3>
                  <div className="flex items-center p-4 border border-green-200 bg-green-50 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4 text-green-700 font-bold text-sm">
                      DT
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Paiement à la livraison</div>
                      <div className="text-sm text-gray-600">Payez en espèces à la réception de votre commande</div>
                    </div>
                  </div>
                </div>


                <button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Commande en cours...
                    </>
                  ) : (
                    'Confirmer la commande'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Résumé de la commande</h2>
              
              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src={getProductImageUrl(
                        getImagesForColor(
                          item.product?.images,
                          normalizeCartColors(item)[0]
                        )[0] || item.product?.images?.[0]
                      )}
                      alt={item.product?.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.product?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Qté: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {(item.price * item.quantity).toFixed(2)} DT
                    </p>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-medium">{totalAmount.toFixed(2)} DT</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Livraison</span>
                  <span className="font-medium">{shippingCost.toFixed(2)} DT</span>
                </div>
                
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {finalTotal.toFixed(2)} DT
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <span>🔒</span>
                  <span>Paiement sécurisé</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
