import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const LanguageSwitcher = ({ className = '' }) => {
  const { lang, setLang } = useLanguage();

  return (
    <div className={`inline-flex items-center rounded-lg border border-gray-200 bg-gray-100 p-0.5 shadow-inner ${className}`}>
      <button
        type="button"
        onClick={() => setLang('fr')}
        className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all duration-200 ${
          lang === 'fr'
            ? 'bg-blue-600 text-white shadow-sm scale-105'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
        }`}
        aria-label="Changer de langue en Français"
      >
        <span className="text-sm">🇫🇷</span>
        <span>FR</span>
      </button>

      <button
        type="button"
        onClick={() => setLang('ar')}
        className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all duration-200 ${
          lang === 'ar'
            ? 'bg-blue-600 text-white shadow-sm scale-105'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
        }`}
        aria-label="تغيير اللغة إلى العربية"
      >
        <span className="text-sm">🇹🇳</span>
        <span>AR</span>
      </button>
    </div>
  );
};

export default LanguageSwitcher;
