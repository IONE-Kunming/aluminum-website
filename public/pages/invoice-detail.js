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
            <div class="dropdown-wrapper">
              <button class="btn btn-primary" id="download-btn">
                <i data-lucide="download"></i>
                Download
                <i data-lucide="chevron-down"></i>
              </button>
              <div class="dropdown-menu" id="download-menu">
                <button class="dropdown-item" data-format="pdf">
                  <i data-lucide="file-text"></i>
                  PDF Document
                </button>
                <button class="dropdown-item" data-format="csv">
                  <i data-lucide="table"></i>
                  CSV Spreadsheet
                </button>
                <button class="dropdown-item" data-format="txt">
                  <i data-lucide="file"></i>
                  Text File
                </button>
              </div>
            </div>
            <button class="btn btn-secondary" id="print-btn">
              <i data-lucide="printer"></i>
              Print
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
    
    // Download dropdown functionality
    const downloadBtn = document.getElementById('download-btn');
    const downloadMenu = document.getElementById('download-menu');
    
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      downloadMenu.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      downloadMenu.classList.remove('active');
    });
    
    // Handle format selection
    document.querySelectorAll('#download-menu .dropdown-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        const format = item.getAttribute('data-format');
        downloadMenu.classList.remove('active');
        
        switch(format) {
          case 'pdf':
            await downloadPDF(invoice);
            break;
          case 'csv':
            exportInvoiceToCSV(invoice);
            break;
          case 'txt':
            exportInvoiceToTXT(invoice);
            break;
        }
      });
    });
    
    // Print button
    document.getElementById('print-btn').addEventListener('click', () => {
      window.print();
    });
    
    // PDF download function
    async function downloadPDF(invoice) {
      const element = document.getElementById('invoice-document');
      const invoiceNumber = invoice.invoiceNumber || 'export';
      
      // Clone the element to avoid modifying the original
      const clone = element.cloneNode(true);
      
      // Replace SVG logo with a base64 data URL so html2canvas renders it correctly
      const logoImg = clone.querySelector('.invoice-logo-img');
      if (logoImg) {
        try {
          const response = await fetch(logoImg.src);
          const blob = await response.blob();
          const reader = new FileReader();
          await new Promise((resolve) => {
            reader.onload = () => {
              logoImg.src = reader.result;
              resolve();
            };
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          // If logo fetch fails (e.g. CORS or network error), hide it so it doesn't break layout
          console.warn('Could not load logo for PDF export:', err);
          logoImg.style.display = 'none';
        }
      }
      
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
          margin: [0.5, 0.5, 0.5, 0.5],
          filename: `invoice-${invoiceNumber}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff'
          },
          jsPDF: { 
            unit: 'in', 
            format: 'letter', 
            orientation: 'portrait'
          },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        await html2pdf().set(opt).from(clone).save();
        window.toast.success('PDF downloaded successfully');
      } catch (error) {
        console.error('Error generating PDF:', error);
        window.toast.error('Failed to generate PDF. Please try again.');
      } finally {
        // Clean up
        document.body.removeChild(tempContainer);
      }
    }
    
  } catch (error) {
    console.error('Error loading invoice:', error);
    renderPageWithLayout('<div class="error">Failed to load invoice</div>', 'buyer');
  }
}

function renderPage1(invoice) {
  // Get base URL from Vite for proper logo path
  const baseUrl = import.meta.env.BASE_URL || '/';
  // Ensure proper path construction without breaking protocol prefixes
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const logoPath = `${cleanBase}/logo.svg`;
  
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
        <ul class="terms-list">
          ${(invoice.termsAndConditions || DEFAULT_TERMS).map(term => `<li>${escapeHtml(term)}</li>`).join('')}
        </ul>
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
