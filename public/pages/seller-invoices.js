import { renderPageWithLayout } from '../js/layout.js';
import languageManager from '../js/language.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml, formatDate } from '../js/utils.js';
import router from '../js/router.js';

export async function renderSellerInvoices() {
  const t = languageManager.t.bind(languageManager);
  
  // Get current user (seller)
  const user = authManager.getCurrentUser();
  if (!user) {
    const content = `
      <div class="invoices-page">
        <div class="page-header">
          <h1>${t('invoices.title')}</h1>
          <p>${t('invoices.subtitle')}</p>
        </div>
        <div class="empty-state">
          <i data-lucide="alert-circle" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>${t('auth.notAuthenticated')}</h2>
          <p>${t('auth.pleaseLoginToViewInvoices')}</p>
        </div>
      </div>
    `;
    renderPageWithLayout(content, 'seller');
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  
  // Fetch invoices for this seller
  console.log('Fetching invoices for seller:', user.uid);
  const invoices = await dataService.getInvoices({ sellerId: user.uid });
  console.log('Seller invoices fetched:', invoices.length);
  
  const content = `
    <div class="invoices-page">
      <div class="page-header">
        <h1>${t('invoices.title')}</h1>
        <p>${t('invoices.subtitle')}</p>
      </div>

      ${invoices.length === 0 ? `
        <div class="empty-state">
          <i data-lucide="file-text" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>${t('invoices.noInvoices')}</h2>
          <p>${t('invoices.invoicesWillAppear')}</p>
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
                <p><strong>${t('invoices.customer')}:</strong> ${escapeHtml(invoice.buyerCompany || invoice.buyerName || 'N/A')}</p>
                <p><strong>${t('invoices.email')}:</strong> ${escapeHtml(invoice.buyerEmail || 'N/A')}</p>
                <p><strong>${t('invoices.items')}:</strong> ${invoice.items?.length || 0}</p>
              </div>
              
              <div class="invoice-summary">
                <div class="invoice-summary-row">
                  <span>${t('invoices.total')}:</span>
                  <span class="invoice-total">$${invoice.total?.toFixed(2) || '0.00'}</span>
                </div>
                <div class="invoice-summary-row">
                  <span>${t('invoices.received')}:</span>
                  <span class="text-success">$${invoice.depositPaid?.toFixed(2) || '0.00'}</span>
                </div>
                <div class="invoice-summary-row">
                  <span>${t('invoices.balanceDue')}:</span>
                  <span class="text-warning">$${invoice.remainingBalance?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              
              <div class="invoice-actions">
                <button class="btn btn-secondary btn-sm view-invoice-btn" data-invoice-id="${invoice.id}">
                  <i data-lucide="eye"></i>
                  ${t('invoices.viewDetails')}
                </button>
                ${invoice.status !== 'paid' ? `
                  <button class="btn btn-primary btn-sm mark-paid-btn" data-invoice-id="${invoice.id}">
                    <i data-lucide="check-circle"></i>
                    ${t('invoices.markAsPaid')}
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
  
  renderPageWithLayout(content, 'seller');
  if (window.lucide) window.lucide.createIcons();
  
  // Add event listeners
  document.querySelectorAll('.view-invoice-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const invoiceId = btn.dataset.invoiceId;
      router.navigate(`/seller/invoice?id=${invoiceId}`);
    });
  });
  
  document.querySelectorAll('.mark-paid-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const invoiceId = btn.dataset.invoiceId;
      
      if (confirm(t('invoices.markAsPaidConfirm'))) {
        try {
          await dataService.updateInvoiceStatus(invoiceId, 'paid');
          window.toast?.success(t('invoices.invoiceMarkedPaid'));
          // Reload page to show updated status
          renderSellerInvoices();
        } catch (error) {
          console.error('Error marking invoice as paid:', error);
          window.toast?.error(t('invoices.failedToUpdateStatus'));
        }
      }
    });
  });
  
  document.querySelectorAll('.invoice-card').forEach(card => {
    card.addEventListener('click', () => {
      const invoiceId = card.dataset.invoiceId;
      router.navigate(`/seller/invoice?id=${invoiceId}`);
    });
  });
}

