import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon, TruckIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../context/LanguageContext';

const OrderTracking = () => {
  const { t, tx, lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [trackingResult, setTrackingResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = `${t('trackingTitle')} - Delta Fashion`;
    return () => { document.title = 'Delta Fashion - Votre style, notre passion'; };
  }, [t]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    setLoading(true);
    setTimeout(() => {
      setTrackingResult({
        orderNumber: orderNumber,
        status: 'shipped',
        estimatedDelivery: '2024-01-15',
        trackingNumber: 'TN123456789',
        items: [
          { name: 'T-shirt Delta Fashion', quantity: 2, price: 45.00 },
          { name: 'Jean Slim', quantity: 1, price: 89.00 }
        ],
        total: 179.00,
        shippingAddress: {
          name: 'Ahmed Ben Ali',
          address: '123 Avenue Habib Bourguiba',
          city: 'Tunis',
          postalCode: '1000'
        },
        timeline: [
          { status: 'pending', date: '2024-01-10', description: tx('Commande reçue', 'تم استلام الطلب') },
          { status: 'confirmed', date: '2024-01-11', description: tx('Commande confirmée', 'تم تأكيد الطلب') },
          { status: 'processing', date: '2024-01-12', description: tx('Commande en préparation', 'جاري تجهيز الطلب') },
          { status: 'shipped', date: '2024-01-13', description: tx('Commande expédiée', 'تم شحن الطلب') },
          { status: 'delivered', date: null, description: tx('Livraison prévue', 'التسليم المتوقع') }
        ]
      });
      setLoading(false);
    }, 1000);
  };

  const getStatusIcon = (status, isCompleted) => {
    if (isCompleted) {
      return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
    }
    return <ClockIcon className="h-6 w-6 text-gray-400" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return tx('En attente', 'قيد الانتظار');
      case 'confirmed':
        return tx('Confirmée', 'مؤكد');
      case 'processing':
        return tx('En cours de traitement', 'قيد المعالجة');
      case 'shipped':
        return tx('Expédiée', 'تم الشحن');
      case 'delivered':
        return tx('Livrée', 'تم التسليم');
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <TruckIcon className="mx-auto h-16 w-16 text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('trackingTitle')}
          </h1>
          <p className="text-lg text-gray-600">
            {tx('Suivez votre commande en temps réel', 'تتبع طلبك في الوقت الفعلي')}
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="flex space-x-4 rtl:space-x-reverse">
              <div className="flex-1">
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder={tx('Numéro de commande (ex: #DF2024001)', 'رقم الطلب (مثال: #DF2024001)')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !orderNumber.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 rtl:space-x-reverse text-sm font-medium"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                <span>{loading ? tx('Recherche...', 'جاري البحث...') : t('search')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Tracking Results */}
        {trackingResult && (
          <div className="space-y-8">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {tx('Commande', 'الطلب')} #{trackingResult.orderNumber}
                  </h2>
                  <p className="text-gray-600">
                    {tx('Passée le', 'بتاريخ')} {new Date().toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR')}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(trackingResult.status)}`}>
                  {getStatusText(trackingResult.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{t('total')}</h3>
                  <p className="text-2xl font-bold text-blue-600">{trackingResult.total} {t('currency')}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{tx('Numéro de suivi', 'رقم التتبع')}</h3>
                  <p className="text-lg font-mono text-gray-600">{trackingResult.trackingNumber}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{tx('Livraison prévue', 'التسليم المتوقع')}</h3>
                  <p className="text-lg text-gray-600">
                    {new Date(trackingResult.estimatedDelivery).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">{tx('Historique de la commande', 'سجل الطلب')}</h3>
              
              <div className="space-y-4">
                {trackingResult.timeline.map((step, index) => {
                  const isCompleted = step.date !== null;
                  const isLast = index === trackingResult.timeline.length - 1;
                  
                  return (
                    <div key={index} className="flex items-start space-x-4 rtl:space-x-reverse">
                      <div className="flex-shrink-0">
                        {getStatusIcon(step.status, isCompleted)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {step.description}
                          </p>
                          {step.date && (
                            <p className="text-sm text-gray-500">
                              {new Date(step.date).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR')}
                            </p>
                          )}
                        </div>
                        {!isLast && (
                          <div className="mt-2 h-4 w-px bg-gray-300 ml-3 rtl:ml-0 rtl:mr-3"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">{tx('Articles commandés', 'المنتجات المطلوبة')}</h3>
              
              <div className="space-y-4">
                {trackingResult.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 rtl:space-x-reverse p-4 border border-gray-200 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500">📦</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">
                        {t('quantity')}: {item.quantity} • {tx('Prix', 'السعر')}: {item.price} {t('currency')}
                      </p>
                    </div>
                    <div className="text-right rtl:text-left">
                      <p className="font-semibold text-gray-900">
                        {(item.price * item.quantity).toFixed(2)} {t('currency')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{tx('Adresse de livraison', 'عنوان التوصيل')}</h3>
              
              <div className="text-gray-600">
                <p className="font-medium">{trackingResult.shippingAddress.name}</p>
                <p>{trackingResult.shippingAddress.address}</p>
                <p>{trackingResult.shippingAddress.postalCode} {trackingResult.shippingAddress.city}</p>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {tx("Besoin d'aide ?", 'هل تحتاج إلى مساعدة؟')}
          </h3>
          <p className="text-gray-600 mb-6">
            {tx("Si vous avez des questions concernant votre commande, n'hésitez pas à nous contacter.", 'إذا كانت لديك أي استفسارات بخصوص طلبك، فلا تتردد في الاتصال بنا.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {tx('Nous contacter', 'اتصل بنا')}
            </a>
            <a
              href="tel:+21625807407"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors border border-blue-600"
            >
              📞 {t('callNow')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
