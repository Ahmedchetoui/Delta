import React, { useState, useEffect } from 'react';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { useLanguage } from '../context/LanguageContext';

const Contact = () => {
  const { t, lang } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    document.title = `${t('contactUs')} - Delta Fashion`;
    return () => { document.title = 'Delta Fashion - Votre style, notre passion'; };
  }, [t]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success(lang === 'ar' ? 'تم إرسال الرسالة! سنقوم بالرد عليك في أقرب وقت.' : 'Message envoyé ! Nous vous répondrons dans les plus brefs délais.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('contactUs')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('contactSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('sendMessage')}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('fullName')} *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={lang === 'ar' ? 'اسمك الكامل' : 'Votre nom'}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('subject')} *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('selectSubject')}</option>
                  <option value="question">{t('generalQuestion')}</option>
                  <option value="order">{t('orderSubject')}</option>
                  <option value="return">{t('returnSubject')}</option>
                  <option value="complaint">{t('complaintSubject')}</option>
                  <option value="suggestion">{t('suggestionSubject')}</option>
                  <option value="other">{t('otherSubject')}</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('message')} *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('describeRequest')}
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {t('sendButton')}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Details */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t('contactInfoHeading')}
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4 rtl:space-x-reverse">
                  <PhoneIcon className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('phone')}</h3>
                    <p className="text-gray-600" dir="ltr">+216 25 807 407</p>
                    <p className="text-sm text-gray-500">{lang === 'ar' ? 'الإثنين-الجمعة: 9ص-6م' : 'Lun-Ven: 9h-18h'}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 rtl:space-x-reverse">
                  <EnvelopeIcon className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600" dir="ltr">contact@deltafashion.tn</p>
                    <p className="text-sm text-gray-500">{t('responseDelay')}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 rtl:space-x-reverse">
                  <MapPinIcon className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('address')}</h3>
                    <p className="text-gray-600">
                      {lang === 'ar' ? 'المنستير، منزل النور' : 'Monastir, Manzel ennour'}<br />
                      {lang === 'ar' ? 'تونس' : 'Tunisie'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 rtl:space-x-reverse">
                  <ClockIcon className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('schedules')}</h3>
                    <div className="text-gray-600 text-sm">
                      <p>{lang === 'ar' ? 'الإثنين - الجمعة: 9:00 - 18:00' : 'Lundi - Vendredi: 9h00 - 18h00'}</p>
                      <p>{lang === 'ar' ? 'السبت: 9:00 - 16:00' : 'Samedi: 9h00 - 16h00'}</p>
                      <p>{lang === 'ar' ? 'الأحد: مغلق' : 'Dimanche: Fermé'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t('faqHeading')}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {lang === 'ar' ? 'كيف يمكنني تتبع طلبي؟' : 'Comment puis-je suivre ma commande ?'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {lang === 'ar' ? 'ستتلقى رمز التتبع فور شحن الطلب، ويمكنك استخدام صفحة متابعة الطلبات على موقعنا.' : 'Vous recevrez un email de confirmation avec un numéro de suivi. Vous pouvez également utiliser notre page de suivi des commandes.'}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {lang === 'ar' ? 'ما هي آليات وأوقات التوصيل؟' : 'Quels sont vos délais de livraison ?'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {lang === 'ar' ? 'التوصيل العادي يستغرق بين 2 إلى 3 أيام عمل لجميع الولايات.' : 'La livraison standard prend 2-3 jours ouvrés. La livraison express est disponible pour 1 jour ouvré.'}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {lang === 'ar' ? 'هل يمكنني إرجاع أو استبدال منتج؟' : 'Puis-je retourner un article ?'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {lang === 'ar' ? 'نعم، يمكنك استبدال المنتج بنفس القيمة أو إرجاعه وفق شروط الإرجاع لدينا.' : 'Oui, vous avez 14 jours pour retourner un article non porté, dans son emballage d\'origine.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
