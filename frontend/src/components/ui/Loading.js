import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Loading = ({ size = 'medium', text }) => {
  const { t } = useLanguage();
  const loadingText = text !== undefined ? text : t('loading');
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
    xlarge: 'h-32 w-32'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
      {loadingText && (
        <p className="mt-4 text-gray-600 text-sm">{loadingText}</p>
      )}
    </div>
  );
};

export default Loading;
