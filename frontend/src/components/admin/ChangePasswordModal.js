import React, { useState } from 'react';
import { 
  XMarkIcon, 
  LockClosedIcon, 
  KeyIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { authService } from '../../services/api';
import { toast } from 'react-toastify';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const resetAndClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.currentPassword) {
      toast.error("Veuillez saisir votre mot de passe actuel");
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error("Le nouveau mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (formData.newPassword === formData.currentPassword) {
      toast.error("Le nouveau mot de passe doit être différent de l'actuel");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Les deux nouveaux mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      toast.success("✅ Mot de passe modifié avec succès !");
      resetAndClose();
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      const msg = error.response?.data?.message || 
                  error.response?.data?.errors?.[0]?.msg || 
                  "Échec de la modification du mot de passe";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isLengthValid = formData.newPassword.length >= 8;
  const isMatching = formData.newPassword && formData.newPassword === formData.confirmPassword;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) resetAndClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <KeyIcon className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">Modifier le mot de passe</h3>
              <p className="text-xs text-gray-300">Sécurité du compte administrateur</p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Mot de passe actuel */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Mot de passe actuel *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <LockClosedIcon className="w-5 h-5" />
              </div>
              <input
                type={showPasswords.current ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Votre mot de passe actuel"
                required
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
              />
              <button
                type="button"
                onClick={() => toggleVisibility('current')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Nouveau mot de passe *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <KeyIcon className="w-5 h-5" />
              </div>
              <input
                type={showPasswords.new ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Minimum 8 caractères"
                required
                minLength={8}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
              />
              <button
                type="button"
                onClick={() => toggleVisibility('new')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Aide validation longueur */}
            <div className="flex items-center gap-1.5 mt-1.5 text-xs">
              <CheckCircleIcon 
                className={`w-4 h-4 ${isLengthValid ? 'text-green-600' : 'text-gray-300'}`} 
              />
              <span className={isLengthValid ? 'text-green-700 font-medium' : 'text-gray-500'}>
                Au moins 8 caractères ({formData.newPassword.length}/8)
              </span>
            </div>
          </div>

          {/* Confirmer le mot de passe */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Confirmer le nouveau mot de passe *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <KeyIcon className="w-5 h-5" />
              </div>
              <input
                type={showPasswords.confirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Répétez le mot de passe"
                required
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
              />
              <button
                type="button"
                onClick={() => toggleVisibility('confirm')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {formData.confirmPassword && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                <CheckCircleIcon 
                  className={`w-4 h-4 ${isMatching ? 'text-green-600' : 'text-red-500'}`} 
                />
                <span className={isMatching ? 'text-green-700 font-medium' : 'text-red-600'}>
                  {isMatching ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
                </span>
              </div>
            )}
          </div>

          {/* Boutons actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={resetAndClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !isLengthValid || !isMatching}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Modification en cours...</span>
                </>
              ) : (
                <>
                  <KeyIcon className="w-4 h-4" />
                  <span>Enregistrer le mot de passe</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
