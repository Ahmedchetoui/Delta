import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../context/LanguageContext';
import { calculateShippingCost } from '../constants/shipping';

const OrderConfirmation = () => {
  const location = useLocation();
  const { t, tx } = useLanguage();
  const { orderId, orderNumber } = location.state || {};
  const shippingCost = calculateShippingCost();

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{tx('Commande non trouvée', 'الطلب غير موجود')}</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            {tx("Retour à l'accueil", 'العودة إلى الرئيسية')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Icône de succès */}
          <div className="flex justify-center mb-6">
            <CheckCircleIcon className="h-16 w-16 text-green-500" />
          </div>

          {/* Message de confirmation */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('orderConfirmed')}
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            {t('orderConfirmedMessage')}
          </p>

          {/* Détails de la commande */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('orderDetails')}
            </h2>
            
            <div className="space-y-2 text-left rtl:text-right">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('orderNumberLabel')}</span>
                <span className="font-semibold text-gray-900">{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('orderIdLabel')}</span>
                <span className="font-mono text-sm text-gray-700">{orderId}</span>
              </div>
            </div>
          </div>

          {/* Informations importantes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              {t('whatNext')}
            </h3>
            <ul className="text-left rtl:text-right text-blue-800 space-y-2">
              <li>• {tx('Nous traiterons votre commande dans les 24h', 'سنعالج طلبك خلال 24 ساعة')}</li>
              <li>• {tx('Vous serez contacté par téléphone pour la livraison', 'سيتم الاتصال بك هاتفياً لتنسيق التوصيل')}</li>
              <li>• {tx(`Frais de livraison : ${shippingCost} DT sur toutes les commandes`, `مصاريف التوصيل: ${shippingCost} د.ت على جميع الطلبات`)}</li>
              <li>• {tx('Conservez votre code colis ou votre numéro de téléphone pour le suivi', 'احتفظ برمز الطرد أو رقم هاتفك لمتابعة الطلب')}</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('continueShopping')}
            </Link>
            <Link
              to="/guest-order-tracking"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              {t('trackMyOrder')}
            </Link>
            <Link
              to="/contact"
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {tx('Nous contacter', 'اتصل بنا')}
            </Link>
          </div>

          {/* Note importante pour les invités */}
          <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3 rtl:ml-0 rtl:mr-3 text-left rtl:text-right">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">{tx('Important - Conservez ces informations', 'مهم - احتفظ بهذه المعلومات')}</h3>
                <div className="text-sm text-yellow-700 space-y-2">
                  <p><strong>{t('orderNumberLabel')}</strong> {orderNumber}</p>
                  <p><strong>{tx('Code colis Fiabilo :', 'رمز طرد Fiabilo:')}</strong> {tx("fourni après l'expédition (code-barres)", 'يُقدَّم بعد الشحن (باركود)')}</p>
                  <p><strong>{tx('Téléphone :', 'الهاتف:')}</strong> {tx('les 8 derniers chiffres de votre numéro', 'آخر 8 أرقام من رقم هاتفك')}</p>
                  <p className="mt-3 font-medium">
                    {tx('Ces informations sont nécessaires pour suivre votre commande.', 'هذه المعلومات ضرورية لمتابعة طلبك.')}
                    <Link to="/guest-order-tracking" className="text-yellow-900 underline mx-1">
                      {tx('Cliquez ici pour le suivi', 'اضغط هنا للمتابعة')}
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Invitation à créer un compte */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>{tx('Astuce :', 'نصيحة:')}</strong> {tx("Créez un compte pour suivre facilement toutes vos commandes et bénéficier d'avantages exclusifs.", 'أنشئ حساباً لمتابعة جميع طلباتك بسهولة والاستفادة من مزايا حصرية.')}
              <Link to="/register" className="text-blue-900 underline mx-1 font-medium">
                {tx("S'inscrire maintenant", 'سجّل الآن')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
