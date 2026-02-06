// Language Manager
import en from './translations/en.js';
import zh from './translations/zh.js';
import ar from './translations/ar.js';

class LanguageManager {
  constructor() {
    this.translations = { en, zh, ar };
    this.currentLanguage = localStorage.getItem('language') || 'en';
    this.init();
  }

  init() {
    this.applyLanguage(this.currentLanguage);
  }

  applyLanguage(lang) {
    this.currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Apply RTL for Arabic
    if (lang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
    
    // Dispatch custom event for components to update
    window.dispatchEvent(new CustomEvent('languageChange', { detail: { language: lang } }));
  }

  setLanguage(lang) {
    if (this.translations[lang]) {
      this.applyLanguage(lang);
      // Reload current page to apply translations
      window.location.reload();
    }
  }

  getLanguage() {
    return this.currentLanguage;
  }

  t(path) {
    const keys = path.split('.');
    let value = this.translations[this.currentLanguage];
    
    for (const key of keys) {
      value = value?.[key];
    }
    
    return value || path;
  }

  // Helper method to get all translations for a section
  getSection(section) {
    return this.translations[this.currentLanguage]?.[section] || {};
  }
}

export default new LanguageManager();
