class DynamicTranslator {
  constructor() {
    this.cache = new Map();
    this.currentLanguage = 'en';
    this.isTranslating = false;
  }

  async translateText(text, targetLang) {
    if (!text || targetLang === 'en') return text;
    
    // Check cache first
    const cacheKey = `${text}_${targetLang}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Using Google Translate API via a proxy service (free)
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
      const data = await response.json();
      
      let translatedText = data.responseData?.translatedText || text;
      
      // If MyMemory fails, try LibreTranslate as backup
      if (translatedText === text && text.length > 0) {
        try {
          const libResponse = await fetch('https://libretranslate.de/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              q: text,
              source: 'en',
              target: targetLang,
              format: 'text'
            })
          });
          const libData = await libResponse.json();
          translatedText = libData.translatedText || text;
        } catch (libError) {
          console.warn('LibreTranslate backup failed:', libError);
        }
      }

      // Cache the result
      this.cache.set(cacheKey, translatedText);
      return translatedText;
    } catch (error) {
      console.warn('Translation failed for:', text, error);
      return text;
    }
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    // Trigger re-translation of all components
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
  }

  getLanguage() {
    return this.currentLanguage;
  }

  // Clear cache when needed
  clearCache() {
    this.cache.clear();
  }
}

export const dynamicTranslator = new DynamicTranslator();