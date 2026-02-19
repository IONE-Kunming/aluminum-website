import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import languageManager from '../js/language.js';
import dataService from '../js/dataService.js';
import { escapeHtml, formatDate, exportInvoiceToCSV, exportInvoiceToTXT } from '../js/utils.js';
import html2pdf from 'html2pdf.js';

// Fallback dimensions for the logo canvas when natural dimensions are unavailable
const DEFAULT_LOGO_WIDTH = 200;
const DEFAULT_LOGO_HEIGHT = 80;

/** Format item dimensions (stored in meters) as a cm string, e.g. " (120.0 cm × 240.0 cm)" */
function formatItemDimensions(dimensions) {
  if (dimensions && typeof dimensions.length === 'number' && typeof dimensions.width === 'number') {
    return ` (${(dimensions.length * 100).toFixed(1)} cm × ${(dimensions.width * 100).toFixed(1)} cm)`;
  }
  return '';
}

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
    const profile = authManager.getUserProfile();
    if (invoice.buyerId !== user.uid && invoice.sellerId !== user.uid && profile?.role !== 'admin') {
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
                <div class="dropdown-item dropdown-has-sub" id="pdf-parent-item">
                  <i data-lucide="file-text"></i>
                  PDF Document
                  <svg class="dropdown-submenu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  <div class="dropdown-submenu" id="pdf-submenu">
                    <button class="dropdown-item" data-format="pdf-en">
                      <i data-lucide="file-text"></i>
                      English
                    </button>
                    <button class="dropdown-item" data-format="pdf-zh">
                      <i data-lucide="file-text"></i>
                      中文
                    </button>
                    <button class="dropdown-item" data-format="pdf-ar">
                      <i data-lucide="file-text"></i>
                      العربية
                    </button>
                    <button class="dropdown-item" data-format="pdf-ur">
                      <i data-lucide="file-text"></i>
                      اردو
                    </button>
                  </div>
                </div>
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
    
    renderPageWithLayout(content, isBuyer ? 'buyer' : (profile?.role === 'admin' ? 'admin' : 'seller'));
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
      const pdfParent = document.getElementById('pdf-parent-item');
      if (pdfParent) pdfParent.classList.remove('sub-open');
    });

    // Toggle sub-menu on click (touch-device fallback; hover handles desktop)
    const pdfParentItem = document.getElementById('pdf-parent-item');
    if (pdfParentItem) {
      pdfParentItem.addEventListener('click', (e) => {
        e.stopPropagation();
        pdfParentItem.classList.toggle('sub-open');
      });
    }
    
    // Handle format selection — only fire on actual buttons with data-format
    document.querySelectorAll('#download-menu button[data-format]').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        const format = item.getAttribute('data-format');
        downloadMenu.classList.remove('active');
        if (pdfParentItem) pdfParentItem.classList.remove('sub-open');
        
        switch(format) {
          case 'pdf-en':
            await downloadPDF(invoice, 'en');
            break;
          case 'pdf-zh':
            await downloadPDF(invoice, 'zh');
            break;
          case 'pdf-ar':
            await downloadPDF(invoice, 'ar');
            break;
          case 'pdf-ur':
            await downloadPDF(invoice, 'ur');
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
    async function downloadPDF(invoice, lang = 'en') {
      const invoiceNumber = invoice.invoiceNumber || 'export';
      
      // Render invoice HTML for the requested language
      const htmlString = renderInvoiceHtml(invoice, lang);
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '8.5in';
      tempContainer.innerHTML = htmlString;
      document.body.appendChild(tempContainer);
      
      // Convert SVG logo to PNG via canvas so html2canvas renders it correctly
      const logoImg = tempContainer.querySelector('.invoice-logo-img');
      if (logoImg) {
        try {
          const pngDataUrl = await new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth || DEFAULT_LOGO_WIDTH;
              canvas.height = img.naturalHeight || DEFAULT_LOGO_HEIGHT;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = logoImg.src;
          });
          logoImg.src = pngDataUrl;
        } catch (err) {
          // If logo conversion fails, hide it so it doesn't break layout
          console.warn('Could not convert logo for PDF export:', err);
          logoImg.style.display = 'none';
        }
      }
      
      try {
        const opt = {
          margin: [0.5, 0.5, 0.5, 0.5],
          filename: `invoice-${invoiceNumber}-${lang}.pdf`,
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
        
        await html2pdf().set(opt).from(tempContainer).save();
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
                <span class="item-name">${escapeHtml(item.productName || 'N/A')}${formatItemDimensions(item.dimensions)}</span>
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

function getInvoiceTranslations(lang) {
  const inv = languageManager.translations[lang]?.invoices || {};
  const base = {
    en: {
      seller: 'Seller', buyer: 'Buyer', date: 'Date', invoiceNo: 'Invoice No.',
      paymentInstructions: 'Payment Instructions',
      bankName: 'Bank Name', accountName: 'Account Name',
      accountNumber: 'Account Number', swiftCode: 'SWIFT Code',
      paymentInstructionsNA: 'Payment instructions not available',
      orderItems: 'Order Items', subtotal: 'Subtotal', tax: 'Tax',
      totalOrderAmount: 'Total Order Amount USD', paymentTerm: 'Payment Term',
      depositPaid: 'Deposit Paid', balanceDue: 'Balance Due',
      termsAndConditions: 'Terms and Conditions', notes: 'Notes',
      forQuestions: 'For questions about this invoice, please contact:',
      thankYou: 'Thank you for your business!'
    },
    zh: {
      seller: '卖家', buyer: '买家', date: '日期', invoiceNo: '发票号',
      paymentInstructions: '付款说明',
      bankName: '银行名称', accountName: '账户名称',
      accountNumber: '账号', swiftCode: 'SWIFT代码',
      paymentInstructionsNA: '付款说明不可用',
      orderItems: '订单商品', subtotal: '小计', tax: '税费',
      totalOrderAmount: '订单总金额（美元）', paymentTerm: '付款条款',
      depositPaid: '已支付订金', balanceDue: '应付余额',
      termsAndConditions: '条款和条件', notes: '备注',
      forQuestions: '如有关于此发票的问题，请联系：',
      thankYou: '感谢您的惠顾！'
    },
    ar: {
      seller: 'البائع', buyer: 'المشتري', date: 'التاريخ', invoiceNo: 'رقم الفاتورة',
      paymentInstructions: 'تعليمات الدفع',
      bankName: 'اسم البنك', accountName: 'اسم الحساب',
      accountNumber: 'رقم الحساب', swiftCode: 'رمز سويفت',
      paymentInstructionsNA: 'تعليمات الدفع غير متوفرة',
      orderItems: 'عناصر الطلب', subtotal: 'المجموع الفرعي', tax: 'الضريبة',
      totalOrderAmount: 'إجمالي مبلغ الطلب (دولار أمريكي)', paymentTerm: 'شروط الدفع',
      depositPaid: 'العربون المدفوع', balanceDue: 'الرصيد المستحق',
      termsAndConditions: 'الشروط والأحكام', notes: 'ملاحظات',
      forQuestions: 'لأي استفسارات حول هذه الفاتورة، يرجى التواصل:',
      thankYou: 'شكراً لتعاملكم معنا!'
    },
    ur: {
      seller: 'فروخت کنندہ', buyer: 'خریدار', date: 'تاریخ', invoiceNo: 'رسید نمبر',
      paymentInstructions: 'ادائیگی کی ہدایات',
      bankName: 'بینک کا نام', accountName: 'اکاؤنٹ کا نام',
      accountNumber: 'اکاؤنٹ نمبر', swiftCode: 'سوئفٹ کوڈ',
      paymentInstructionsNA: 'ادائیگی کی ہدایات دستیاب نہیں',
      orderItems: 'آرڈر کی اشیاء', subtotal: 'ذیلی کل', tax: 'ٹیکس',
      totalOrderAmount: 'آرڈر کی کل رقم (USD)', paymentTerm: 'ادائیگی کی شرط',
      depositPaid: 'جمع ادا شدہ', balanceDue: 'واجب الادا رقم',
      termsAndConditions: 'شرائط و ضوابط', notes: 'نوٹس',
      forQuestions: 'اس رسید کے بارے میں سوالات کے لیے، براہ کرم رابطہ کریں:',
      thankYou: 'آپ کے کاروبار کا شکریہ!'
    }
  };
  // Merge base strings with any available invoice translation keys
  return { ...(base[lang] || base.en), ...inv };
}

function renderInvoiceHtml(invoice, lang) {
  const t = getInvoiceTranslations(lang);
  const isRtl = lang === 'ar' || lang === 'ur';
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const logoPath = `${cleanBase}/logo.svg`;

  return `
    <div class="invoice-page page-1"${isRtl ? ' dir="rtl"' : ''}>
      <!-- Header Section with Logo -->
      <div class="invoice-header-section">
        <div class="invoice-logo">
          <img src="${logoPath}" alt="IONE Logo" class="invoice-logo-img">
          <p class="invoice-company-name">${escapeHtml(invoice.sellerCompany || 'HK KANDIVAN I T C L')}</p>
        </div>
        <div class="invoice-info-header">
          <div class="invoice-header-row">
            <div class="invoice-header-item">
              <span class="invoice-label">${t.date}:</span>
              <span class="invoice-value">${formatDate(invoice.createdAt)}</span>
            </div>
            <div class="invoice-header-item">
              <span class="invoice-label">${t.invoiceNo}:</span>
              <span class="invoice-value invoice-number">${escapeHtml(invoice.invoiceNumber)}</span>
            </div>
          </div>
          <div class="invoice-status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</div>
        </div>
      </div>
      
      <!-- Parties Section -->
      <div class="invoice-parties">
        <div class="invoice-party">
          <h3>${t.seller}</h3>
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
          <h3>${t.buyer}</h3>
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
        <h3 class="section-title">${t.paymentInstructions}</h3>
        <div class="payment-instructions-content">
          ${invoice.paymentInstructions ? `
            <p><strong>${t.bankName}:</strong> ${escapeHtml(invoice.paymentInstructions.bankName || 'N/A')}</p>
            <p><strong>${t.accountName}:</strong> ${escapeHtml(invoice.paymentInstructions.accountName || 'N/A')}</p>
            <p><strong>${t.accountNumber}:</strong> ${escapeHtml(invoice.paymentInstructions.accountNumber || 'N/A')}</p>
            <p><strong>${t.swiftCode}:</strong> ${escapeHtml(invoice.paymentInstructions.swiftCode || 'N/A')}</p>
          ` : `<p>${t.paymentInstructionsNA}</p>`}
        </div>
      </div>
      
      <!-- Order Details and Payment Terms -->
      <div class="invoice-order-summary">
        <div class="order-items-summary">
          <h3 class="section-title">${t.orderItems}</h3>
          <div class="items-list">
            ${(invoice.items || []).map((item) => `
              <div class="item-row">
                <span class="item-name">${escapeHtml(item.productName || 'N/A')}${formatItemDimensions(item.dimensions)}</span>
                <span class="item-details">${item.quantity || 0} ${escapeHtml(item.unit || 'units')} × $${(item.pricePerUnit || 0).toFixed(2)}</span>
                <span class="item-amount">$${(item.subtotal || 0).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="invoice-totals-section">
          <div class="totals-row">
            <span>${t.subtotal}:</span>
            <span>$${(invoice.subtotal || 0).toFixed(2)}</span>
          </div>
          ${invoice.tax && invoice.tax > 0 ? `
          <div class="totals-row">
            <span>${t.tax} (${invoice.taxRate || 10}%):</span>
            <span>$${(invoice.tax || 0).toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="totals-row total-amount">
            <span>${t.totalOrderAmount}:</span>
            <span>$${(invoice.total || 0).toFixed(2)}</span>
          </div>
        </div>
        
        <div class="payment-terms-box">
          <div class="payment-term-item">
            <span class="term-label">${t.paymentTerm}:</span>
            <span class="term-value">${escapeHtml(invoice.paymentTerms || 'N/A')}</span>
          </div>
          ${invoice.depositPaid && invoice.depositPaid > 0 ? `
          <div class="payment-term-item">
            <span class="term-label">${t.depositPaid}:</span>
            <span class="term-value deposit-paid">$${(invoice.depositPaid || 0).toFixed(2)}</span>
          </div>
          <div class="payment-term-item">
            <span class="term-label">${t.balanceDue}:</span>
            <span class="term-value balance-due">$${(invoice.remainingBalance || 0).toFixed(2)}</span>
          </div>
          ` : ''}
        </div>
      </div>
      
      <!-- Terms and Conditions Section -->
      <div class="invoice-terms-conditions">
        <h3 class="section-title">${t.termsAndConditions}</h3>
        <ul class="terms-list">
          ${(invoice.termsAndConditions || DEFAULT_TERMS).map(term => `<li>${escapeHtml(term)}</li>`).join('')}
        </ul>
      </div>
      
      ${invoice.notes ? `
        <div class="invoice-notes">
          <p><strong>${t.notes}:</strong> ${escapeHtml(invoice.notes)}</p>
        </div>
      ` : ''}
      
      <!-- Footer -->
      <div class="invoice-footer">
        <p>${t.forQuestions} ${escapeHtml(invoice.sellerEmail || 'contactus@ione.live')}</p>
        <p class="thank-you">${t.thankYou}</p>
      </div>
    </div>
  `;
}
