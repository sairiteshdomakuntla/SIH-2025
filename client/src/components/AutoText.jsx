import React, { useState, useEffect } from 'react';
import { dynamicTranslator } from '../utils/dynamicTranslator';

const AutoText = ({ children, tag: Tag = 'span', className = '', fallback = true, ...props }) => {
  const [translatedText, setTranslatedText] = useState(children);
  const [isLoading, setIsLoading] = useState(false);
  const [translationFailed, setTranslationFailed] = useState(false);

  const translateContent = async (text, language) => {
    if (typeof text !== 'string' || !text.trim()) return text;
    
    setIsLoading(true);
    setTranslationFailed(false);
    
    try {
      const translated = await dynamicTranslator.translateText(text, language);
      
      // If translation returns the same text and we're not in English, it might have failed
      if (translated === text && language !== 'en') {
        setTranslationFailed(true);
      }
      
      setTranslatedText(translated);
    } catch (error) {
      console.warn('AutoText translation error:', error);
      setTranslationFailed(true);
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
      setTranslationFailed(false);
    }
  }, [children]);

  useEffect(() => {
    const handleLanguageChange = (event) => {
      const newLang = event.detail;
      if (newLang !== 'en') {
        translateContent(children, newLang);
      } else {
        setTranslatedText(children);
        setTranslationFailed(false);
      }
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, [children]);

  // If fallback is disabled and translation failed, render nothing
  if (!fallback && translationFailed && dynamicTranslator.getLanguage() !== 'en') {
    return null;
  }

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