import React, { useState, useEffect } from 'react';
import { dynamicTranslator } from '../utils/dynamicTranslator';

const AutoText = ({ children, tag: Tag = 'span', className = '', ...props }) => {
  const [translatedText, setTranslatedText] = useState(children);
  const [isLoading, setIsLoading] = useState(false);

  const translateContent = async (text, language) => {
    if (typeof text !== 'string' || !text.trim()) return text;
    
    setIsLoading(true);
    try {
      const translated = await dynamicTranslator.translateText(text, language);
      setTranslatedText(translated);
    } catch (error) {
      setTranslatedText(text); // Fallback to original
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const currentLang = dynamicTranslator.getLanguage();
    if (currentLang !== 'en') {
      translateContent(children, currentLang);
    } else {
      setTranslatedText(children);
    }
  }, [children]);

  useEffect(() => {
    const handleLanguageChange = (event) => {
      const newLang = event.detail;
      if (newLang !== 'en') {
        translateContent(children, newLang);
      } else {
        setTranslatedText(children);
      }
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, [children]);

  return (
    <Tag className={className} {...props}>
      {isLoading ? (
        <span className="opacity-50">{children}</span>
      ) : (
        translatedText
      )}
    </Tag>
  );
};

export default AutoText;