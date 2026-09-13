import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const languages = [
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'ar', label: 'AR', flag: '🇹🇳' },
];

const LanguageSwitcher = ({ className = '', variant = 'desktop' }) => {
  const { lang, setLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef(null);
  const isMobile = variant === 'mobile';

  useEffect(() => {
    if (!isMobile || !isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!switcherRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMobile, isOpen]);

  if (isMobile) {
    const activeLanguage = languages.find((language) => language.code === lang) || languages[0];

    return (
      <div ref={switcherRef} className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold text-gray-700 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          aria-label="Choisir la langue"
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          <span className="text-sm" aria-hidden="true">{activeLanguage.flag}</span>
          <span>{activeLanguage.label}</span>
          <svg className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 z-50 mt-2 w-24 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg" role="menu" aria-label="Langues">
            {languages.map((language) => (
              <button
                key={language.code}
                type="button"
                role="menuitemradio"
                aria-checked={lang === language.code}
                onClick={() => {
                  setLang(language.code);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold transition-colors ${
                  lang === language.code
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-sm" aria-hidden="true">{language.flag}</span>
                <span>{language.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

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
