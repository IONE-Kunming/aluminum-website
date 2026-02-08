import { renderPageWithLayout } from '../js/layout.js';
import languageManager from '../js/language.js';
import dataService from '../js/dataService.js';
import { escapeHtml } from '../js/utils.js';

export async function renderSellers() {
  const t = languageManager.t.bind(languageManager);
  
  // Fetch sellers from database
  const sellers = await dataService.getSellers();
  
  const content = `
    <div class="sellers-page">
      <div class="page-header">
        <h1>${t('sellers.title')}</h1>
        <p>${t('sellers.subtitle')}</p>
      </div>

      ${sellers.length === 0 ? `
        <div class="empty-state">
          <i data-lucide="store" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>${t('sellers.loading')}</h2>
          <p>${t('sellers.directory')}</p>
        </div>
      ` : `
        <div class="sellers-grid">
          ${sellers.map(seller => `
            <div class="seller-card card">
              <div class="seller-header">
                <div class="seller-avatar">
                  <i data-lucide="store" style="width: 32px; height: 32px;"></i>
                </div>
                <div class="seller-info">
                  <h3>${escapeHtml(seller.displayName || seller.email || 'Unknown Seller')}</h3>
                  ${seller.companyName ? `<p class="seller-company">${escapeHtml(seller.companyName)}</p>` : ''}
                </div>
              </div>
              <div class="seller-body">
                ${seller.email ? `
                  <div class="seller-detail">
                    <i data-lucide="mail"></i>
                    <span>${escapeHtml(seller.email)}</span>
                  </div>
                ` : ''}
                ${seller.phoneNumber ? `
                  <div class="seller-detail">
                    <i data-lucide="phone"></i>
                    <span>${escapeHtml(seller.phoneNumber)}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  if (window.lucide) window.lucide.createIcons();
}
