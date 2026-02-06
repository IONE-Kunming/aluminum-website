import { renderPageWithLayout } from '../js/layout.js';

export function renderInvoices() {
  const content = `
    <div class="invoices-page">
      <div class="page-header">
        <h1>Invoices</h1>
        <p>View and download your invoices</p>
      </div>

      <div class="empty-state">
        <i data-lucide="file-text" style="width: 64px; height: 64px; opacity: 0.3;"></i>
        <h2>No invoices yet</h2>
        <p>Your invoices will appear here after order completion</p>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  if (window.lucide) window.lucide.createIcons();
}
