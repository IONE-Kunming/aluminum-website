// Translation Service
// This service provides automatic message translation capabilities for chat messages
// Currently implements a stub/placeholder that can be integrated with external translation APIs

class TranslationService {
  constructor() {
    this.apiKey = 'AIzaSyDLumkxN_6uKWwqJKs5QwOT8jP9sGCW0hQ'; // Gemini API key
    this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'; // Gemini API endpoint
    this.enabled = true; // Set to true when API is configured
  }

  /**
   * Initialize the translation service with API credentials
   * @param {Object} config - Configuration object
   * @param {string} config.apiKey - Translation API key
   * @param {string} config.apiEndpoint - API endpoint URL
   */
  init(config) {
    if (config?.apiKey && config?.apiEndpoint) {
      this.apiKey = config.apiKey;
      this.apiEndpoint = config.apiEndpoint;
      this.enabled = true;
      console.log('Translation service initialized');
    } else {
      console.warn('Translation service not configured. Set API key and endpoint to enable automatic translation.');
    }
  }

  /**
   * Check if translation is needed between two languages
   * @param {string} sourceLanguage - Source language code (e.g., 'en', 'zh', 'ar', 'ur')
   * @param {string} targetLanguage - Target language code
   * @returns {boolean} - True if translation is needed
   */
  shouldTranslate(sourceLanguage, targetLanguage) {
    if (!sourceLanguage || !targetLanguage) return false;
    return sourceLanguage !== targetLanguage;
  }

  /**
   * Translate text from one language to another
   * This is a stub implementation. Replace with actual API call when ready.
   * 
   * Example implementation with Google Cloud Translation API:
   * 
   * async translateText(text, sourceLanguage, targetLanguage) {
   *   if (!this.enabled) {
   *     console.warn('Translation service not enabled');
   *     return null;
   *   }
   *   
   *   try {
   *     const response = await fetch(this.apiEndpoint, {
   *       method: 'POST',
   *       headers: {
   *         'Content-Type': 'application/json',
   *         'Authorization': `Bearer ${this.apiKey}`
   *       },
   *       body: JSON.stringify({
   *         q: text,
   *         source: sourceLanguage,
   *         target: targetLanguage,
   *         format: 'text'
   *       })
   *     });
   *     
   *     const data = await response.json();
   *     return data.data.translations[0].translatedText;
   *   } catch (error) {
   *     console.error('Translation error:', error);
   *     return null;
   *   }
   * }
   * 
   * @param {string} text - Text to translate
   * @param {string} sourceLanguage - Source language code
   * @param {string} targetLanguage - Target language code
   * @returns {Promise<string|null>} - Translated text or null if translation fails
   */
  async translateText(text, sourceLanguage, targetLanguage) {
    if (!this.enabled) {
      console.warn('Translation service not enabled. Configure API credentials to enable automatic translation.');
      return null;
    }

    if (!this.shouldTranslate(sourceLanguage, targetLanguage)) {
      return text; // No translation needed
    }

    try {
      // Map language codes to full language names for Gemini
      const languageNames = {
        en: 'English',
        zh: 'Chinese',
        ar: 'Arabic',
        ur: 'Urdu'
      };
      
      const sourceLangName = languageNames[sourceLanguage] || sourceLanguage;
      const targetLangName = languageNames[targetLanguage] || targetLanguage;
      
      // Create prompt for Gemini to translate
      const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}. Only provide the translation, nothing else:\n\n${text}`;
      
      // Call Gemini API
      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API error:', response.status, errorData);
        return null;
      }
      
      const data = await response.json();
      
      // Extract translated text from Gemini response
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        const translatedText = data.candidates[0].content.parts[0].text.trim();
        console.log(`Translated: "${text}" → "${translatedText}"`);
        return translatedText;
      }
      
      console.error('Unexpected Gemini API response format:', data);
      return null;
      
    } catch (error) {
      console.error('Translation error:', error);
      return null;
    }
  }

  /**
   * Translate multiple messages in batch
   * More efficient than translating one at a time
   * @param {Array} messages - Array of message objects with text, sourceLanguage, targetLanguage
   * @returns {Promise<Array>} - Array of translated texts
   */
  async translateBatch(messages) {
    if (!this.enabled) {
      console.warn('Translation service not enabled');
      return messages.map(() => null);
    }

    // Stub implementation - replace with actual batch API call
    const translations = await Promise.all(
      messages.map(msg => 
        this.translateText(msg.text, msg.sourceLanguage, msg.targetLanguage)
      )
    );

    return translations;
  }

  /**
   * Get supported languages
   * @returns {Array} - Array of supported language codes
   */
  getSupportedLanguages() {
    // These match the languages available in the application
    return ['en', 'zh', 'ar', 'ur'];
  }

  /**
   * Get language name in English
   * @param {string} code - Language code
   * @returns {string} - Language name
   */
  getLanguageName(code) {
    const names = {
      en: 'English',
      zh: 'Chinese',
      ar: 'Arabic',
      ur: 'Urdu'
    };
    return names[code] || code;
  }
}

// Export singleton instance
const translationService = new TranslationService();
export default translationService;
