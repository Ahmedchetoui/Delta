import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  createAdminRequest, 
  fetchUserAdminRequestStatus 
} from '../store/slices/adminRequestSlice';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../context/LanguageContext';

const RequestAdmin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, tx, lang } = useLanguage();
  const { user } = useSelector((state) => state.auth);
  const { userRequest, isCreating, error } = useSelector((state) => state.adminRequests);

  const [formData, setFormData] = useState({
    reason: '',
    phone: user?.phone || ''
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin');
      return;
    }
    
    dispatch(fetchUserAdminRequestStatus());
  }, [dispatch, navigate, user]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason.trim()) {
      toast.error(tx('Veuillez expliquer pourquoi vous souhaitez devenir administrateur', 'يرجى توضيح سبب رغبتك في أن تصبح مسؤولاً'));
      return;
    }

    try {
      await dispatch(createAdminRequest(formData)).unwrap();
      toast.success(tx('Demande d\'administration envoyée avec succès !', 'تم إرسال طلب صلاحية المسؤول بنجاح!'));
      dispatch(fetchUserAdminRequestStatus());
    } catch (error) {
      toast.error(error || tx('Erreur lors de l\'envoi de la demande', 'حدث خطأ أثناء إرسال الطلب'));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-6 w-6 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return tx('Approuvée', 'تمت الموافقة');
      case 'rejected':
        return tx('Rejetée', 'مرفوض');
      case 'pending':
        return tx('En attente', 'قيد الانتظار');
      default:
        return tx('Inconnu', 'غير معروف');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (userRequest) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                {getStatusIcon(userRequest.status)}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('requestAdminNav')}
              </h1>
              <p className="text-gray-600">
                {tx('Statut de votre demande', 'حالة طلبك')}
              </p>
            </div>

            <div className="space-y-6">
              {/* Statut */}
              <div className="text-center">
                <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(userRequest.status)}`}>
                  {getStatusText(userRequest.status)}
                </span>
              </div>

              {/* Détails de la demande */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{tx('Détails de la demande', 'تفاصيل الطلب')}</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-3 rtl:mr-0 rtl:ml-3" />
                    <div>
                      <p className="text-sm text-gray-500">{t('fullName')}</p>
                      <p className="font-medium text-gray-900">
                        {userRequest.firstName} {userRequest.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 rtl:mr-0 rtl:ml-3" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{userRequest.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3 rtl:mr-0 rtl:ml-3" />
                    <div>
                      <p className="text-sm text-gray-500">{t('phone')}</p>
                      <p className="font-medium text-gray-900" dir="ltr">{userRequest.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3 rtl:mr-0 rtl:ml-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">{tx('Raison', 'السبب')}</p>
                      <p className="font-medium text-gray-900">{userRequest.reason}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">{tx('Date de soumission', 'تاريخ الإرسال')}</p>
                    <p className="font-medium text-gray-900">
                      {new Date(userRequest.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes de révision */}
              {userRequest.reviewNotes && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{tx('Notes de révision', 'ملاحظات المراجعة')}</h3>
                  <p className="text-gray-700">{userRequest.reviewNotes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="text-center">
                <button
                  onClick={() => navigate('/profile')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {tx('Retour au profil', 'العودة إلى الملف الشخصي')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('requestAdminNav')}
            </h1>
            <p className="text-gray-600">
              {tx('Demandez à devenir administrateur de Delta Fashion', 'اطلب الحصول على صلاحية مسؤول في Delta Fashion')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations utilisateur */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{tx('Vos informations', 'معلوماتك')}</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-3 rtl:mr-0 rtl:ml-3" />
                  <div>
                    <p className="text-sm text-gray-500">{t('fullName')}</p>
                    <p className="font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 rtl:mr-0 rtl:ml-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{user?.email}</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('phone')}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+216 XX XXX XXX"
                  />
                </div>
              </div>
            </div>

            {/* Raison */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                {tx('Pourquoi souhaitez-vous devenir administrateur ? *', 'لماذا ترغب في أن تصبح مسؤولاً؟ *')}
              </label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={tx('Expliquez vos motivations et votre expérience...', 'اشرح دوافعك وخبراتك...')}
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                {tx('Maximum 500 caractères', 'الحد الأقصى 500 حرف')}
              </p>
            </div>

            {/* Boutons */}
            <div className="flex space-x-4 rtl:space-x-reverse">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
              >
                {tx('Annuler', 'إلغاء')}
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? tx('Envoi en cours...', 'جاري الإرسال...') : tx('Envoyer la demande', 'إرسال الطلب')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestAdmin;
