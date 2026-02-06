import { renderPageWithLayout } from '../js/layout.js';
import languageManager from '../js/language.js';

export function renderSellers() {
  const t = languageManager.t.bind(languageManager);
  
  const content = `
    <div class="sellers-page">
      <div class="page-header">
        <h1>${t('sellers.title')}</h1>
        <p>${t('sellers.subtitle')}</p>
      </div>

      <div class="empty-state">
        <i data-lucide="store" style="width: 64px; height: 64px; opacity: 0.3;"></i>
        <h2>${t('sellers.loading')}</h2>
        <p>${t('sellers.directory')}</p>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  if (window.lucide) window.lucide.createIcons();
}
