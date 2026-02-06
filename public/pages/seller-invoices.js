import { renderPageWithLayout } from '../js/layout.js';

export function renderSellerInvoices() {
  const content = `
    <div class="invoices-page">
      <div class="page-header">
        <h1>Invoices</h1>
        <p>Manage and generate invoices</p>
      </div>

      <div class="empty-state">
        <i data-lucide="file-text" style="width: 64px; height: 64px; opacity: 0.3;"></i>
        <h2>No invoices yet</h2>
        <p>Invoices will be generated for completed orders</p>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'seller');
  if (window.lucide) window.lucide.createIcons();
}
