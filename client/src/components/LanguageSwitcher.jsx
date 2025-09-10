import React, { useState, useEffect } from 'react';
import { Languages } from 'lucide-react';
import { dynamicTranslator } from '../utils/dynamicTranslator';

const LanguageSwitcher = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' }
  ];

  useEffect(() => {
    // Get saved language or default to English
    const savedLang = localStorage.getItem('selectedLanguage') || 'en';
    setCurrentLanguage(savedLang);
    dynamicTranslator.setLanguage(savedLang);
  }, []);

  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    dynamicTranslator.setLanguage(langCode);
  };

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white transition-all duration-300">
        <Languages className="w-4 h-4" />
        <span className="text-sm font-medium">
          {languages.find(lang => lang.code === currentLanguage)?.flag || '🌐'}
        </span>
      </button>
      
      <div className="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-xl border border-purple-500/30 rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 min-w-[140px] z-50">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-purple-600/20 transition-colors duration-200 ${
              currentLanguage === lang.code ? 'bg-purple-600/30 text-purple-200' : 'text-white/80'
            }`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="text-sm font-medium">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;