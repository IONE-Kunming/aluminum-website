import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml, formatDate, exportInvoiceToCSV, exportInvoiceToTXT } from '../js/utils.js';
import html2pdf from 'html2pdf.js';

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
    
    // Render page 1 content (single page invoice)
    const page1Content = renderPage1(invoice);
    
    const content = `
      <div class="invoice-detail-page">
        <div class="invoice-actions-header no-print">
          <button class="btn btn-text" onclick="history.back()">
            <i data-lucide="arrow-left"></i>
            Back
          </button>
          <div class="invoice-actions">
            <button class="btn btn-secondary" id="download-pdf-btn">
              <i data-lucide="file-text"></i>
              Download PDF
            </button>
            <button class="btn btn-secondary" id="download-csv-btn">
              <i data-lucide="table"></i>
              Download CSV
            </button>
            <button class="btn btn-secondary" id="download-txt-btn">
              <i data-lucide="file"></i>
              Download TXT
            </button>
          </div>
        </div>
        
        <div class="invoice-document" id="invoice-document">
          ${page1Content}
        </div>
      </div>
    `;
    
    renderPageWithLayout(content, isBuyer ? 'buyer' : 'seller');
    if (window.lucide) window.lucide.createIcons();
    
    // PDF download button (uses html2pdf.js for proper export)
    document.getElementById('download-pdf-btn').addEventListener('click', async () => {
      const element = document.getElementById('invoice-document');
      const invoiceNumber = invoice.invoiceNumber || 'export';
      
      // Clone the element to avoid modifying the original
      const clone = element.cloneNode(true);
      
      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '8.5in'; // US Letter width
      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);
      
      try {
        const opt = {
          margin: 0.75,
          filename: `invoice-${invoiceNumber}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          },
          jsPDF: { 
            unit: 'in', 
            format: 'letter', 
            orientation: 'portrait'
          }
        };
        
        await html2pdf().set(opt).from(clone).save();
      } catch (error) {
        console.error('Error generating PDF:', error);
        window.toast.error('Failed to generate PDF. Please try again.');
      } finally {
        // Clean up
        document.body.removeChild(tempContainer);
      }
    });
    
    // CSV download button
    document.getElementById('download-csv-btn').addEventListener('click', () => {
      exportInvoiceToCSV(invoice);
    });
    
    // TXT download button
    document.getElementById('download-txt-btn').addEventListener('click', () => {
      exportInvoiceToTXT(invoice);
    });
    
  } catch (error) {
    console.error('Error loading invoice:', error);
    renderPageWithLayout('<div class="error">Failed to load invoice</div>', 'buyer');
  }
}

function renderPage1(invoice) {
  // Get base URL from Vite for proper logo path
  const baseUrl = import.meta.env.BASE_URL || '/';
  const logoPath = `${baseUrl.replace(/\/+$/, '')}/logo.svg`.replace('//', '/'); // Ensure proper path construction
  
  return `
    <div class="invoice-page page-1">
      <!-- Header Section with Logo -->
      <div class="invoice-header-section">
        <div class="invoice-logo">
          <img src="${logoPath}" alt="IONE Logo" class="invoice-logo-img">
          <p class="invoice-company-name">${escapeHtml(invoice.sellerCompany || 'HK KANDIVAN I T C L')}</p>
        </div>
        <div class="invoice-info-header">
          <div class="invoice-header-row">
            <div class="invoice-header-item">
              <span class="invoice-label">Date:</span>
              <span class="invoice-value">${formatDate(invoice.createdAt)}</span>
            </div>
            <div class="invoice-header-item">
              <span class="invoice-label">Invoice No.:</span>
              <span class="invoice-value invoice-number">${escapeHtml(invoice.invoiceNumber)}</span>
            </div>
          </div>
          <div class="invoice-status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</div>
        </div>
      </div>
      
      <!-- Parties Section -->
      <div class="invoice-parties">
        <div class="invoice-party">
          <h3>Seller</h3>
          <div class="party-details">
            <p class="party-name">${escapeHtml(invoice.sellerCompany || 'HK KANDIVAN I T C L')}</p>
            ${invoice.sellerAddress && invoice.sellerAddress.street ? `
              <p>${escapeHtml(invoice.sellerAddress.street)}</p>
              <p>${escapeHtml(invoice.sellerAddress.city || 'Hua Qiang Bei, Shenzhen')}, ${escapeHtml(invoice.sellerAddress.state || 'Guandong')}</p>
              <p>${escapeHtml(invoice.sellerAddress.country || 'China')}</p>
            ` : `
              <p>Hua Qiang Bei, Shenzhen, Guandong</p>
            `}
            <p>Phone Number: ${escapeHtml(invoice.sellerPhone || '008613332800284')}</p>
            <p>Email: ${escapeHtml(invoice.sellerEmail || 'contactus@ione.live')}</p>
          </div>
        </div>
        <div class="invoice-party">
          <h3>Buyer</h3>
          <div class="party-details">
            <p class="party-name">${escapeHtml(invoice.buyerCompany || invoice.buyerName || 'N/A')}</p>
            ${invoice.buyerAddress && invoice.buyerAddress.street ? `
              <p>${escapeHtml(invoice.buyerAddress.street)}</p>
              <p>${escapeHtml(invoice.buyerAddress.city || '')}, ${escapeHtml(invoice.buyerAddress.state || '')}</p>
              ${invoice.buyerAddress.country ? `<p>${escapeHtml(invoice.buyerAddress.country)}</p>` : ''}
            ` : ''}
            ${invoice.buyerPhone ? `<p>Phone Number: ${escapeHtml(invoice.buyerPhone)}</p>` : ''}
            <p>Email: ${escapeHtml(invoice.buyerEmail || 'N/A')}</p>
          </div>
        </div>
      </div>
      
      <!-- Payment Instructions Section -->
      <div class="invoice-payment-instructions">
        <h3 class="section-title">Payment Instructions</h3>
        <div class="payment-instructions-content">
          ${invoice.paymentInstructions ? `
            <p><strong>Bank Name:</strong> ${escapeHtml(invoice.paymentInstructions.bankName || 'N/A')}</p>
            <p><strong>Account Name:</strong> ${escapeHtml(invoice.paymentInstructions.accountName || 'N/A')}</p>
            <p><strong>Account Number:</strong> ${escapeHtml(invoice.paymentInstructions.accountNumber || 'N/A')}</p>
            <p><strong>SWIFT Code:</strong> ${escapeHtml(invoice.paymentInstructions.swiftCode || 'N/A')}</p>
          ` : '<p>Payment instructions not available</p>'}
        </div>
      </div>
      
      <!-- Order Details and Payment Terms -->
      <div class="invoice-order-summary">
        <div class="order-items-summary">
          <h3 class="section-title">Order Items</h3>
          <div class="items-list">
            ${(invoice.items || []).map((item, index) => `
              <div class="item-row">
                <span class="item-name">${escapeHtml(item.productName || 'N/A')}</span>
                <span class="item-details">${item.quantity || 0} ${escapeHtml(item.unit || 'units')} × $${(item.pricePerUnit || 0).toFixed(2)}</span>
                <span class="item-amount">$${(item.subtotal || 0).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="invoice-totals-section">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>$${(invoice.subtotal || 0).toFixed(2)}</span>
          </div>
          ${invoice.tax && invoice.tax > 0 ? `
          <div class="totals-row">
            <span>Tax (${invoice.taxRate || 10}%):</span>
            <span>$${(invoice.tax || 0).toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="totals-row total-amount">
            <span>Total Order Amount USD:</span>
            <span>$${(invoice.total || 0).toFixed(2)}</span>
          </div>
        </div>
        
        <div class="payment-terms-box">
          <div class="payment-term-item">
            <span class="term-label">Payment Term:</span>
            <span class="term-value">${escapeHtml(invoice.paymentTerms || 'N/A')}</span>
          </div>
          ${invoice.depositPaid && invoice.depositPaid > 0 ? `
          <div class="payment-term-item">
            <span class="term-label">Deposit Paid:</span>
            <span class="term-value deposit-paid">$${(invoice.depositPaid || 0).toFixed(2)}</span>
          </div>
          <div class="payment-term-item">
            <span class="term-label">Balance Due:</span>
            <span class="term-value balance-due">$${(invoice.remainingBalance || 0).toFixed(2)}</span>
          </div>
          ` : ''}
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
          <p><strong>Notes:</strong> ${escapeHtml(invoice.notes)}</p>
        </div>
      ` : ''}
      
      <!-- Footer -->
      <div class="invoice-footer">
        <p>For questions about this invoice, please contact: ${escapeHtml(invoice.sellerEmail || 'contactus@ione.live')}</p>
        <p class="thank-you">Thank you for your business!</p>
      </div>
    </div>
  `;
}

// Removed renderPage2 function - now using single-page design
