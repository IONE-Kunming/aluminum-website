import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml, formatDate } from '../js/utils.js';
import router from '../js/router.js';

export async function renderSellerInvoices() {
  // Get current user (seller)
  const user = authManager.getCurrentUser();
  if (!user) {
    const content = `
      <div class="invoices-page">
        <div class="page-header">
          <h1>Invoices</h1>
          <p>Manage and generate invoices</p>
        </div>
        <div class="empty-state">
          <i data-lucide="alert-circle" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>Not Authenticated</h2>
          <p>Please log in to view invoices</p>
        </div>
      </div>
    `;
    renderPageWithLayout(content, 'seller');
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  
  // Fetch invoices for this seller
  const invoices = await dataService.getInvoices({ sellerId: user.uid });
  
  const content = `
    <div class="invoices-page">
      <div class="page-header">
        <h1>Invoices</h1>
        <p>Manage and generate invoices</p>
      </div>

      ${invoices.length === 0 ? `
        <div class="empty-state">
          <i data-lucide="file-text" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>No invoices yet</h2>
          <p>Invoices will be generated for completed orders</p>
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
                <p><strong>Customer:</strong> ${escapeHtml(invoice.buyerCompany || invoice.buyerName || 'N/A')}</p>
                <p><strong>Email:</strong> ${escapeHtml(invoice.buyerEmail || 'N/A')}</p>
                <p><strong>Items:</strong> ${invoice.items?.length || 0}</p>
              </div>
              
              <div class="invoice-summary">
                <div class="invoice-summary-row">
                  <span>Total:</span>
                  <span class="invoice-total">$${invoice.total?.toFixed(2) || '0.00'}</span>
                </div>
                <div class="invoice-summary-row">
                  <span>Received:</span>
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
                <button class="btn btn-secondary btn-sm print-invoice-btn" data-invoice-id="${invoice.id}">
                  <i data-lucide="printer"></i>
                  Print
                </button>
                ${invoice.status !== 'paid' ? `
                  <button class="btn btn-primary btn-sm mark-paid-btn" data-invoice-id="${invoice.id}">
                    <i data-lucide="check-circle"></i>
                    Mark as Paid
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
  
  document.querySelectorAll('.print-invoice-btn').forEach(btn => {
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
      
      if (confirm('Mark this invoice as paid?')) {
        try {
          await dataService.updateInvoiceStatus(invoiceId, 'paid');
          window.toast?.success('Invoice marked as paid');
          // Reload page to show updated status
          renderSellerInvoices();
        } catch (error) {
          console.error('Error marking invoice as paid:', error);
          window.toast?.error('Failed to update invoice status');
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

