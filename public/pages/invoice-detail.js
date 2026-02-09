import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml, formatDate } from '../js/utils.js';

export async function renderInvoiceDetail() {
  // Get invoice ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const invoiceId = urlParams.get('id');
  
  if (!invoiceId) {
    renderPageWithLayout('<div class="error">Invoice ID not provided</div>', 'buyer');
    return;
  }
  
  try {
    const invoice = await dataService.getInvoice(invoiceId);
    const user = authManager.getCurrentUser();
    
    // Verify user has access
    if (invoice.buyerId !== user.uid && invoice.sellerId !== user.uid) {
      renderPageWithLayout('<div class="error">Access denied</div>', 'buyer');
      return;
    }
    
    const isBuyer = invoice.buyerId === user.uid;
    
    const content = `
      <div class="invoice-detail-page">
        <div class="invoice-actions-header">
          <button class="btn btn-text" onclick="history.back()">
            <i data-lucide="arrow-left"></i>
            Back
          </button>
          <div class="invoice-actions">
            <button class="btn btn-secondary" id="print-invoice-btn">
              <i data-lucide="printer"></i>
              Print
            </button>
          </div>
        </div>
        
        <div class="invoice-document" id="invoice-document">
          <div class="invoice-header-section">
            <div class="invoice-logo">
              <h1>INVOICE</h1>
              <p class="invoice-number">${escapeHtml(invoice.invoiceNumber)}</p>
            </div>
            <div class="invoice-dates">
              <p><strong>Date:</strong> ${formatDate(invoice.createdAt)}</p>
              <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
              <p><strong>Status:</strong> <span class="status-badge status-${invoice.status}">${invoice.status}</span></p>
            </div>
          </div>
          
          <div class="invoice-parties">
            <div class="invoice-party">
              <h3>From:</h3>
              <p><strong>${escapeHtml(invoice.sellerCompany || 'N/A')}</strong></p>
              <p>${escapeHtml(invoice.sellerName || 'N/A')}</p>
              <p>${escapeHtml(invoice.sellerEmail || 'N/A')}</p>
              ${invoice.sellerAddress && invoice.sellerAddress.street ? `
                <p>${escapeHtml(invoice.sellerAddress.street)}</p>
                <p>${escapeHtml(invoice.sellerAddress.city || '')}, ${escapeHtml(invoice.sellerAddress.state || '')} ${escapeHtml(invoice.sellerAddress.zip || '')}</p>
                <p>${escapeHtml(invoice.sellerAddress.country || '')}</p>
              ` : ''}
            </div>
            <div class="invoice-party">
              <h3>Bill To:</h3>
              <p><strong>${escapeHtml(invoice.buyerCompany || 'N/A')}</strong></p>
              <p>${escapeHtml(invoice.buyerName || 'N/A')}</p>
              <p>${escapeHtml(invoice.buyerEmail || 'N/A')}</p>
              ${invoice.buyerAddress && invoice.buyerAddress.street ? `
                <p>${escapeHtml(invoice.buyerAddress.street)}</p>
                <p>${escapeHtml(invoice.buyerAddress.city || '')}, ${escapeHtml(invoice.buyerAddress.state || '')} ${escapeHtml(invoice.buyerAddress.zip || '')}</p>
                <p>${escapeHtml(invoice.buyerAddress.country || '')}</p>
              ` : ''}
            </div>
          </div>
          
          <table class="invoice-items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>
                    <strong>${escapeHtml(item.productName || 'N/A')}</strong>
                    ${item.description ? `<br><small>${escapeHtml(item.description)}</small>` : ''}
                  </td>
                  <td>${item.quantity || 0} ${escapeHtml(item.unit || 'units')}</td>
                  <td>$${(item.pricePerUnit || 0).toFixed(2)}</td>
                  <td>$${(item.subtotal || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="invoice-totals">
            <div class="invoice-total-row">
              <span>Subtotal:</span>
              <span>$${(invoice.subtotal || 0).toFixed(2)}</span>
            </div>
            <div class="invoice-total-row">
              <span>Tax (${invoice.taxRate || 10}%):</span>
              <span>$${(invoice.tax || 0).toFixed(2)}</span>
            </div>
            <div class="invoice-total-row invoice-total-main">
              <span>Total:</span>
              <span>$${(invoice.total || 0).toFixed(2)}</span>
            </div>
            <div class="invoice-total-row">
              <span>Deposit Paid:</span>
              <span class="text-success">$${(invoice.depositPaid || 0).toFixed(2)}</span>
            </div>
            <div class="invoice-total-row">
              <span>Balance Due:</span>
              <span class="text-warning">$${(invoice.remainingBalance || 0).toFixed(2)}</span>
            </div>
          </div>
          
          <div class="invoice-payment-info">
            <p><strong>Payment Method:</strong> ${escapeHtml(invoice.paymentMethod || 'N/A')}</p>
            <p><strong>Payment Terms:</strong> ${escapeHtml(invoice.paymentTerms || 'N/A')}</p>
          </div>
          
          ${invoice.notes ? `
            <div class="invoice-notes">
              <p><strong>Notes:</strong></p>
              <p>${escapeHtml(invoice.notes)}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    renderPageWithLayout(content, isBuyer ? 'buyer' : 'seller');
    if (window.lucide) window.lucide.createIcons();
    
    // Print button
    document.getElementById('print-invoice-btn').addEventListener('click', () => {
      window.print();
    });
    
  } catch (error) {
    console.error('Error loading invoice:', error);
    renderPageWithLayout('<div class="error">Failed to load invoice</div>', 'buyer');
  }
}
