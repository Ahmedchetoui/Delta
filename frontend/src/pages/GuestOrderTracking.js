import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { ArrowPathIcon, TruckIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { getFiabiloBadgeClass } from '../utils/fiabiloTracking';

const GuestOrderTracking = () => {
  const [reference, setReference] = useState('');
  const [order, setOrder] = useState(null);
  const [trackingOnly, setTrackingOnly] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [fiabiloTracking, setFiabiloTracking] = useState(null);
  const [fiabiloError, setFiabiloError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const fetchTracking = async ({ live = false } = {}) => {
    const liveQuery = live ? '?live=1' : '';
    const encoded = encodeURIComponent(reference.trim());
    const response = await api.get(`/orders/track/${encoded}${liveQuery}`);

    setTrackingOnly(Boolean(response.data.trackingOnly));
    setOrder(response.data.order || null);
    setTrackingCode(
      response.data.trackingCode ||
      response.data.order?.fiabilo?.trackingCode ||
      response.data.order?.trackingNumber ||
      ''
    );
    setFiabiloTracking(
      response.data.fiabiloTracking ||
      response.data.order?.fiabiloTracking ||
      null
    );
    setFiabiloError(
      response.data.fiabiloTrackingError ||
      response.data.order?.fiabiloTrackingError ||
      null
    );

    return response.data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reference.trim()) {
      toast.error('Veuillez saisir un numéro de commande ou un code colis');
      return;
    }

    setLoading(true);
    try {
      await fetchTracking({ live: true });
      toast.success('Suivi trouvé !');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.message || 'Suivi non trouvé');
      setOrder(null);
      setTrackingOnly(false);
      setTrackingCode('');
      setFiabiloTracking(null);
      setFiabiloError(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshTracking = async () => {
    setTrackingLoading(true);
    try {
      await fetchTracking({ live: true });
      toast.success('Suivi actualisé');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.message || 'Impossible d\'actualiser le suivi');
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      processing: 'En cours de traitement',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
      refunded: 'Remboursée',
    };
    return statusMap[status] || status;
  };

  const getPaymentStatusText = (status) => {
    const statusMap = {
      pending: 'En attente',
      paid: 'Payé',
      failed: 'Échoué',
      refunded: 'Remboursé',
    };
    return statusMap[status] || status;
  };

  const showResults = order || trackingOnly;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Suivi de commande</h1>
          <p className="text-gray-600">
            Saisissez votre numéro de commande ou votre code colis Fiabilo
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de commande ou code colis
              </label>
              <input
                type="text"
                name="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: CMD-250623-00001 ou 185832040710"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Le code colis est le numéro à 10–12 chiffres fourni par Fiabilo après expédition.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </button>
          </form>
        </div>

        {showResults && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {order && (
              <div className="border-b border-gray-200 pb-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Commande #{order.orderNumber}</h2>
                    <p className="text-gray-600 mt-1">
                      Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                      {getStatusText(order.orderStatus)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {trackingOnly && !order && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Suivi colis Fiabilo</h2>
                <p className="text-sm text-gray-600 mt-1">Code colis : {trackingCode}</p>
              </div>
            )}

            {order && !trackingCode && order.fiabilo?.syncStatus !== 'synced' && (
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                Le suivi livraison Fiabilo sera disponible après l&apos;envoi de votre colis.
              </div>
            )}

            {(trackingCode || fiabiloTracking) && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-orange-900 flex items-center">
                    <TruckIcon className="h-5 w-5 mr-2" />
                    État livraison Fiabilo
                  </h3>
                  {trackingCode && (
                    <button
                      type="button"
                      onClick={handleRefreshTracking}
                      disabled={trackingLoading}
                      className="inline-flex items-center justify-center px-3 py-2 text-sm bg-white border border-orange-300 text-orange-800 rounded-lg hover:bg-orange-100 disabled:opacity-50"
                    >
                      <ArrowPathIcon className={`h-4 w-4 mr-2 ${trackingLoading ? 'animate-spin' : ''}`} />
                      Actualiser
                    </button>
                  )}
                </div>

                {trackingCode && (
                  <p className="text-sm text-orange-800 mb-2">
                    <span className="font-medium">Code colis :</span> {trackingCode}
                  </p>
                )}

                {fiabiloError && (
                  <p className="text-sm text-red-700">{fiabiloError}</p>
                )}

                {fiabiloTracking && (
                  <div className="space-y-2">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getFiabiloBadgeClass(fiabiloTracking.category)}`}>
                      {fiabiloTracking.status}
                    </span>
                    {fiabiloTracking.reason && (
                      <p className="text-sm text-orange-800">
                        <span className="font-medium">Motif :</span> {fiabiloTracking.reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {order && (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Articles commandés</h3>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        <img
                          src={item.image || '/placeholder-image.jpg'}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            {item.size && <p>Taille: {item.size}</p>}
                            {item.color && <p>Couleur: {item.color}</p>}
                            <p>Quantité: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{item.price.toFixed(2)} DT</p>
                          <p className="text-sm text-gray-600">
                            Total: {(item.price * item.quantity).toFixed(2)} DT
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Adresse de livraison</h3>
                    <div className="text-gray-600 space-y-1">
                      <p className="font-medium">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                      <p>{order.shippingAddress.street}</p>
                      <p>{order.shippingAddress.city} {order.shippingAddress.postalCode}</p>
                      <p>{order.shippingAddress.country}</p>
                      <p>📞 {order.shippingAddress.phone}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Résumé financier</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sous-total</span>
                        <span>{order.subtotal.toFixed(2)} DT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Livraison</span>
                        <span>{order.shippingCost.toFixed(2)} DT</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span>{order.total.toFixed(2)} DT</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Paiement</span>
                        <span className="text-sm font-medium text-yellow-600">
                          {getPaymentStatusText(order.paymentStatus)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Besoin d&apos;aide ?</h3>
          <p className="text-blue-700 mb-4">
            Contactez-nous si vous ne trouvez pas votre suivi.
          </p>
          <div className="space-y-2 text-sm text-blue-600">
            <p>📞 Téléphone: +216 25 807 407</p>
            <p>🕒 Horaires: Lun-Ven 9h-18h, Sam 9h-13h</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestOrderTracking;
