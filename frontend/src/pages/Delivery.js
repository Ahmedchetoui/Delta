import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TruckIcon, ClockIcon, ShieldCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { TUNISIA_GOVERNORATES } from '../constants/tunisiaGovernorates';
import { useLanguage } from '../context/LanguageContext';

const Delivery = () => {
  const { t, lang } = useLanguage();

  useEffect(() => {
    document.title = `${t('deliveryAndReturns')} - Delta Fashion`;
    return () => { document.title = 'Delta Fashion - Votre style, notre passion'; };
  }, [t]);

  const deliverySteps = [
    { step: '1', title: t('step1Title'), description: t('step1Desc') },
    { step: '2', title: t('step2Title'), description: t('step2Desc') },
    { step: '3', title: t('step3Title'), description: t('step3Desc') },
    { step: '4', title: t('step4Title'), description: t('step4Desc') }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('deliveryAndReturns')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('deliverySubtitle')}
          </p>
        </div>

        {/* Delivery Options */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {t('deliveryOptions')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <TruckIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('standardDelivery')}
              </h3>
              <p className="text-gray-600 mb-4">
                {t('standardDeliveryDesc')}
              </p>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                8 {t('currency')}
              </div>
              <div className="text-sm text-gray-500">
                {lang === 'ar' ? 'على جميع الطلبيات' : 'Sur toutes les commandes'}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-8 text-center border-2 border-blue-600">
              <ClockIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('expressDelivery')}
              </h3>
              <p className="text-gray-600 mb-4">
                {t('expressDeliveryDesc')}
              </p>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                8 {t('currency')}
              </div>
              <div className="text-sm text-gray-500">
                {lang === 'ar' ? 'متوفر 7/7 أيام' : 'Disponible 7j/7'}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <ArrowPathIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('exchangeOption')}
              </h3>
              <p className="text-gray-600 mb-4">
                {t('exchangeOptionDesc')}
              </p>
              <div className="text-sm text-gray-500">
                {lang === 'ar' ? 'تواصل معنا خلال 14 يوماً من الاستلام' : 'Contactez-nous dans les 14 jours suivant la réception'}
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Process */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {t('deliveryProcess')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {deliverySteps.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Return Policy */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {t('returnPolicy')}
          </h2>
          
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('returnConditions')}
                </h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 rtl:mr-0 rtl:ml-2">✓</span>
                    <span>{lang === 'ar' ? '14 يوماً لإرجاع أو استبدال المنتج' : '14 jours pour retourner un article'}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 rtl:mr-0 rtl:ml-2">✓</span>
                    <span>{lang === 'ar' ? 'المنتج في حالته الأصلية وغير مستعمل' : 'Article non porté et avec étiquettes'}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 rtl:mr-0 rtl:ml-2">✓</span>
                    <span>{lang === 'ar' ? 'الغلاف الأصلي سليم' : 'Emballage d\'origine intact'}</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('returnProcess')}
                </h3>
                <ol className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 rtl:mr-0 rtl:ml-3 mt-0.5 shrink-0">1</span>
                    <span>{lang === 'ar' ? 'تواصل مع خدمة العملاء' : 'Contactez notre service client'}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 rtl:mr-0 rtl:ml-3 mt-0.5 shrink-0">2</span>
                    <span>{lang === 'ar' ? 'تحديد موعد الاستبدال أو الإرجاع' : 'Recevez votre bon de retour'}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 rtl:mr-0 rtl:ml-3 mt-0.5 shrink-0">3</span>
                    <span>{lang === 'ar' ? 'تسليم الطرد للمندوب' : 'Renvoyez l\'article'}</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Coverage Areas */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            {t('coverageAreas')}
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            {t('coverageDesc')}
          </p>

          <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-3 text-gray-700">
              {TUNISIA_GOVERNORATES.map((governorate) => (
                <li key={governorate} className="flex items-center gap-2">
                  <span className="text-blue-600">•</span>
                  <span>{governorate}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact for Delivery */}
        <div className="bg-blue-600 rounded-lg p-8 text-white text-center">
          <ShieldCheckIcon className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">
            {t('needDeliveryHelp')}
          </h2>
          <p className="text-blue-100 mb-6">
            {lang === 'ar' ? 'فريق الدعم واللوجستيات جاهز لمساعدتك في أي وقت' : 'Notre équipe logistique est là pour vous accompagner'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+21625807407"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              📞 {t('callNow')}
            </a>
            <Link
              to="/contact"
              className="bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium"
            >
              💬 {t('contactUs')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Delivery;
