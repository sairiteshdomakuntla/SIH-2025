class DynamicTranslator {
  constructor() {
    this.cache = new Map();
    this.currentLanguage = 'en';
    this.isTranslating = false;
    this.apiLimitReached = false;
    this.failedAttempts = 0;
    this.maxFailedAttempts = 5;
  }

  async translateText(text, targetLang) {
    if (!text || targetLang === 'en') return text;
    
    // If API limit reached, return original text
    if (this.apiLimitReached) {
      return text;
    }
    
    // Check cache first
    const cacheKey = `${text}_${targetLang}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Using Google Translate API via a proxy service (free)
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
      
      // Check for rate limiting or API errors
      if (!response.ok) {
        if (response.status === 429 || response.status === 403) {
          console.warn('Translation API limit reached');
          this.apiLimitReached = true;
          return text;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check for API limit in response
      if (data.quotaFinished || data.responseStatus === 403) {
        console.warn('Translation quota finished');
        this.apiLimitReached = true;
        return text;
      }
      
      let translatedText = data.responseData?.translatedText || text;
      
      // Check for placeholder templates like {0}!, {1}, etc.
      if (translatedText && /\{\d+\}/.test(translatedText)) {
        console.warn('Translation returned template placeholder, using original text');
        translatedText = text;
      }
      
      // If MyMemory fails, try LibreTranslate as backup
      if (translatedText === text && text.length > 0 && !this.apiLimitReached) {
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
          
          if (libResponse.ok) {
            const libData = await libResponse.json();
            translatedText = libData.translatedText || text;
          }
        } catch (libError) {
          console.warn('LibreTranslate backup failed:', libError);
        }
      }

      // Reset failed attempts on success
      this.failedAttempts = 0;
      
      // Cache the result
      this.cache.set(cacheKey, translatedText);
      return translatedText;
    } catch (error) {
      console.warn('Translation failed for:', text, error);
      
      // Increment failed attempts
      this.failedAttempts++;
      
      // If too many failures, disable translation temporarily
      if (this.failedAttempts >= this.maxFailedAttempts) {
        console.warn('Too many translation failures, disabling temporarily');
        this.apiLimitReached = true;
        
        // Re-enable after 5 minutes
        setTimeout(() => {
          this.apiLimitReached = false;
          this.failedAttempts = 0;
          console.log('Translation re-enabled');
        }, 5 * 60 * 1000);
      }
      
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

  // Check if API limit is reached
  isApiLimitReached() {
    return this.apiLimitReached;
  }

  // Reset API limit (for manual recovery)
  resetApiLimit() {
    this.apiLimitReached = false;
    this.failedAttempts = 0;
    console.log('Translation API limit manually reset');
  }

  // Clear cache when needed
  clearCache() {
    this.cache.clear();
  }
}

export const dynamicTranslator = new DynamicTranslator();