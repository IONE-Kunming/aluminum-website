import { renderPageWithLayout } from '../js/layout.js';

export function renderSellers() {
  const content = `
    <div class="sellers-page">
      <div class="page-header">
        <h1>Sellers Directory</h1>
        <p>Browse and connect with aluminum suppliers</p>
      </div>

      <div class="empty-state">
        <i data-lucide="store" style="width: 64px; height: 64px; opacity: 0.3;"></i>
        <h2>Loading sellers...</h2>
        <p>Seller directory will be displayed here</p>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  if (window.lucide) window.lucide.createIcons();
}
