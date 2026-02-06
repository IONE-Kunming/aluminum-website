import { renderPageWithLayout } from '../js/layout.js';
import languageManager from '../js/language.js';

export function renderOrders() {
  const t = languageManager.t.bind(languageManager);
  
  const content = `
    <div class="orders-page">
      <div class="page-header">
        <h1>${t('orders.myOrders')}</h1>
        <p>${t('orders.trackAndManage')}</p>
      </div>

      <div class="empty-state">
        <i data-lucide="package" style="width: 64px; height: 64px; opacity: 0.3;"></i>
        <h2>${t('orders.noOrders')}</h2>
        <p>${t('orders.ordersWillAppear')}</p>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  if (window.lucide) window.lucide.createIcons();
}
