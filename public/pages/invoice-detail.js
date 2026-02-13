import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml, formatDate } from '../js/utils.js';

// Default terms and conditions
const DEFAULT_TERMS = [
  'Payment must be made within 30 days of invoice date.',
  'Late payments may incur additional charges.',
  'All prices are in USD unless otherwise specified.',
  'Products are non-refundable once delivered.',
  'Buyer is responsible for any import duties and taxes.'
];

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
    
    // Render page 1 content (summary)
    const page1Content = renderPage1(invoice);
    
    // Render page 2 content (order details)
    const page2Content = renderPage2(invoice);
    
    const content = `
      <div class="invoice-detail-page">
        <div class="invoice-actions-header no-print">
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
          ${page1Content}
          ${page2Content}
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

function renderPage1(invoice) {
  return `
    <div class="invoice-page page-1">
      <!-- Header Section -->
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
      
      <!-- Parties Section -->
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
      
      <!-- Summary Table -->
      <div class="invoice-summary-section">
        <h3 class="section-title">Order Summary</h3>
        <table class="invoice-summary-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Items</td>
              <td class="text-right">${invoice.items?.length || 0} item(s)</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Totals Section -->
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
      
      <!-- Payment Terms Section -->
      <div class="invoice-payment-terms">
        <h3 class="section-title">Payment Terms</h3>
        <p class="payment-terms-text">${escapeHtml(invoice.paymentTerms || 'N/A')}</p>
      </div>
      
      <!-- Payment Instructions Section -->
      <div class="invoice-payment-instructions">
        <h3 class="section-title">Payment Instructions</h3>
        <div class="payment-instructions-grid">
          <div class="payment-instruction-item">
            <label>Payment Method:</label>
            <span>${escapeHtml((invoice.paymentInstructions?.paymentMethodDetails || invoice.paymentMethod || 'N/A'))}</span>
          </div>
          <div class="payment-instruction-item">
            <label>Bank Name:</label>
            <span>${escapeHtml(invoice.paymentInstructions?.bankName || 'N/A')}</span>
          </div>
          <div class="payment-instruction-item">
            <label>Account Name:</label>
            <span>${escapeHtml(invoice.paymentInstructions?.accountName || 'N/A')}</span>
          </div>
          <div class="payment-instruction-item">
            <label>Account Number:</label>
            <span>${escapeHtml(invoice.paymentInstructions?.accountNumber || 'N/A')}</span>
          </div>
          <div class="payment-instruction-item">
            <label>SWIFT Code:</label>
            <span>${escapeHtml(invoice.paymentInstructions?.swiftCode || 'N/A')}</span>
          </div>
        </div>
      </div>
      
      <!-- Terms and Conditions Section -->
      <div class="invoice-terms-conditions">
        <h3 class="section-title">Terms and Conditions</h3>
        <ol class="terms-list">
          ${(invoice.termsAndConditions || DEFAULT_TERMS).map(term => `<li>${escapeHtml(term)}</li>`).join('')}
        </ol>
      </div>
      
      ${invoice.notes ? `
        <div class="invoice-notes">
          <p><strong>Notes:</strong></p>
          <p>${escapeHtml(invoice.notes)}</p>
        </div>
      ` : ''}
    </div>
  `;
}

function renderPage2(invoice) {
  return `
    <div class="invoice-page page-2">
      <!-- Header for Page 2 -->
      <div class="invoice-page-header">
        <div class="invoice-logo-small">
          <h2>INVOICE</h2>
          <p class="invoice-number-small">${escapeHtml(invoice.invoiceNumber)}</p>
        </div>
      </div>
      
      <!-- Order Details Section -->
      <div class="invoice-order-details">
        <h3 class="section-title">Order Details</h3>
        <table class="invoice-items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th class="text-right">Quantity</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(invoice.items || []).map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>
                  <strong>${escapeHtml(item.productName || 'N/A')}</strong>
                  ${item.description ? `<br><small class="item-description">${escapeHtml(item.description)}</small>` : ''}
                  ${item.specifications ? `<br><small class="item-specs">${escapeHtml(item.specifications)}</small>` : ''}
                </td>
                <td class="text-right">${item.quantity || 0} ${escapeHtml(item.unit || 'units')}</td>
                <td class="text-right">$${(item.pricePerUnit || 0).toFixed(2)}</td>
                <td class="text-right">$${(item.subtotal || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="subtotal-row">
              <td colspan="4" class="text-right"><strong>Subtotal:</strong></td>
              <td class="text-right"><strong>$${(invoice.subtotal || 0).toFixed(2)}</strong></td>
            </tr>
            <tr class="tax-row">
              <td colspan="4" class="text-right">Tax (${invoice.taxRate || 10}%):</td>
              <td class="text-right">$${(invoice.tax || 0).toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="4" class="text-right"><strong>Total:</strong></td>
              <td class="text-right"><strong>$${(invoice.total || 0).toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <!-- Footer with contact info -->
      <div class="invoice-footer">
        <p class="footer-text">For questions about this invoice, please contact: ${escapeHtml(invoice.sellerEmail || 'N/A')}</p>
        <p class="footer-text-small">Thank you for your business!</p>
      </div>
    </div>
  `;
}
