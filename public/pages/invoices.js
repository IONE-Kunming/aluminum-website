import { renderPageWithLayout } from '../js/layout.js';
import languageManager from '../js/language.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml, formatDate } from '../js/utils.js';
import router from '../js/router.js';

export async function renderInvoices() {
  const t = languageManager.t.bind(languageManager);
  
  // Get current user
  const user = authManager.getCurrentUser();
  if (!user) {
    const content = `
      <div class="invoices-page">
        <div class="page-header">
          <h1>${t('invoices.title') || 'Invoices'}</h1>
          <p>${t('invoices.subtitle') || 'View and download your invoices'}</p>
        </div>
        <div class="empty-state">
          <i data-lucide="alert-circle" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>Not Authenticated</h2>
          <p>Please log in to view your invoices</p>
        </div>
      </div>
    `;
    renderPageWithLayout(content, 'buyer');
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  
  // Fetch invoices for this buyer
  const invoices = await dataService.getInvoices({ buyerId: user.uid });
  
  const content = `
    <div class="invoices-page">
      <div class="page-header">
        <h1>${t('invoices.title') || 'Invoices'}</h1>
        <p>${t('invoices.subtitle') || 'View and download your invoices'}</p>
      </div>

      ${invoices.length === 0 ? `
        <div class="empty-state">
          <i data-lucide="file-text" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>No invoices yet</h2>
          <p>Your invoices will appear here after order completion</p>
        </div>
      ` : `
        <div class="invoices-list">
          ${invoices.map(invoice => `
            <div class="invoice-card card" style="cursor: pointer;" data-invoice-id="${invoice.id}">
              <div class="invoice-header">
                <div class="invoice-info">
                  <h3>${escapeHtml(invoice.invoiceNumber)}</h3>
                  <span class="invoice-date">${formatDate(invoice.createdAt)}</span>
                </div>
                <div class="invoice-status">
                  <span class="status-badge status-${invoice.status}">${invoice.status}</span>
                </div>
              </div>
              
              <div class="invoice-details">
                <p><strong>Seller:</strong> ${escapeHtml(invoice.sellerCompany || invoice.sellerName || 'N/A')}</p>
                <p><strong>Items:</strong> ${invoice.items?.length || 0}</p>
              </div>
              
              <div class="invoice-summary">
                <div class="invoice-summary-row">
                  <span>Total:</span>
                  <span class="invoice-total">$${invoice.total?.toFixed(2) || '0.00'}</span>
                </div>
                <div class="invoice-summary-row">
                  <span>Paid:</span>
                  <span class="text-success">$${invoice.depositPaid?.toFixed(2) || '0.00'}</span>
                </div>
                <div class="invoice-summary-row">
                  <span>Balance Due:</span>
                  <span class="text-warning">$${invoice.remainingBalance?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              
              <div class="invoice-actions">
                <button class="btn btn-secondary btn-sm view-invoice-btn" data-invoice-id="${invoice.id}">
                  <i data-lucide="eye"></i>
                  View Details
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
  
  renderPageWithLayout(content, 'buyer');
  if (window.lucide) window.lucide.createIcons();
  
  // Add event listeners
  document.querySelectorAll('.view-invoice-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const invoiceId = btn.dataset.invoiceId;
      router.navigate(`/buyer/invoice?id=${invoiceId}`);
    });
  });
  
  document.querySelectorAll('.invoice-card').forEach(card => {
    card.addEventListener('click', () => {
      const invoiceId = card.dataset.invoiceId;
      router.navigate(`/buyer/invoice?id=${invoiceId}`);
    });
  });
}

