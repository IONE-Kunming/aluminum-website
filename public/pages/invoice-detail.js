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

// Default terms and conditions per language
const DEFAULT_TERMS_BY_LANG = {
  en: [
    'Payment must be made within 30 days of invoice date.',
    'Late payments may incur additional charges.',
    'All prices are in USD unless otherwise specified.',
    'Products are non-refundable once delivered.',
    'Buyer is responsible for any import duties and taxes.',
    'Seller retains ownership until full payment is received.',
    'Disputes must be resolved through arbitration in the seller\'s jurisdiction.'
  ],
  zh: [
    '付款必须在发票日期后30天内完成。',
    '逾期付款可能会产生额外费用。',
    '除另有说明外，所有价格均以美元计价。',
    '产品一经交付，不可退款。',
    '买方负责任何进口关税和税费。',
    '在全额付款之前，卖方保留所有权。',
    '争议必须通过卖方所在司法管辖区的仲裁解决。'
  ],
  ar: [
    'يجب إتمام الدفع خلال 30 يومًا من تاريخ الفاتورة.',
    'قد تترتب رسوم إضافية على المدفوعات المتأخرة.',
    'جميع الأسعار بالدولار الأمريكي ما لم يُذكر خلاف ذلك.',
    'المنتجات غير قابلة للاسترداد بعد التسليم.',
    'المشتري مسؤول عن أي رسوم جمركية وضرائب استيراد.',
    'يحتفظ البائع بالملكية حتى استلام الدفعة الكاملة.',
    'يجب حل النزاعات من خلال التحكيم في نطاق اختصاص البائع.'
  ],
  ur: [
    'ادائیگی رسید کی تاریخ سے 30 دنوں کے اندر کی جانی چاہیے۔',
    'تاخیر سے ادائیگی پر اضافی چارجز لگ سکتے ہیں۔',
    'تمام قیمتیں امریکی ڈالر میں ہیں جب تک کہ دوسری صورت میں بیان نہ کیا گیا ہو۔',
    'مصنوعات ڈیلیوری کے بعد ناقابل واپسی ہیں۔',
    'خریدار کسی بھی درآمدی ڈیوٹی اور ٹیکس کا ذمہ دار ہے۔',
    'مکمل ادائیگی موصول ہونے تک بائع ملکیت برقرار رکھتا ہے۔',
    'تنازعات کو بائع کے دائرہ اختیار میں ثالثی کے ذریعے حل کیا جانا چاہیے۔'
  ]
};

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
    
    // Track current display language
    let currentLang = 'en';
    
    // Render initial content in English
    const page1Content = renderInvoiceHtml(invoice, 'en');
    
    const content = `
      <div class="invoice-detail-page">
        <div class="invoice-actions-header no-print">
          <button class="btn btn-text" onclick="history.back()">
            <i data-lucide="arrow-left"></i>
            Back
          </button>
          <div class="invoice-actions">
            <div class="dropdown-wrapper">
              <button class="btn btn-secondary" id="lang-btn">
                <i data-lucide="languages"></i>
                <span id="lang-btn-label">English</span>
                <i data-lucide="chevron-down"></i>
              </button>
              <div class="dropdown-menu" id="lang-menu">
                <button class="dropdown-item" data-lang="en">English</button>
                <button class="dropdown-item" data-lang="zh">中文</button>
                <button class="dropdown-item" data-lang="ar">العربية</button>
                <button class="dropdown-item" data-lang="ur">اردو</button>
              </div>
            </div>
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
    
    renderPageWithLayout(content, isBuyer ? 'buyer' : (profile?.role === 'admin' ? 'admin' : 'seller'));
    if (window.lucide) window.lucide.createIcons();
    
    const langLabels = { en: 'English', zh: '中文', ar: 'العربية', ur: 'اردو' };
    
    // Language switcher functionality
    const langBtn = document.getElementById('lang-btn');
    const langMenu = document.getElementById('lang-menu');
    
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langMenu.classList.toggle('active');
      // Close the other dropdown
      document.getElementById('download-menu').classList.remove('active');
    });
    
    document.querySelectorAll('#lang-menu button[data-lang]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = item.getAttribute('data-lang');
        langMenu.classList.remove('active');
        
        // Update the displayed invoice to the selected language
        currentLang = lang;
        const invoiceDoc = document.getElementById('invoice-document');
        invoiceDoc.innerHTML = renderInvoiceHtml(invoice, lang);
        document.getElementById('lang-btn-label').textContent = langLabels[lang] || lang;
        if (window.lucide) window.lucide.createIcons();
      });
    });
    
    // Download dropdown functionality
    const downloadBtn = document.getElementById('download-btn');
    const downloadMenu = document.getElementById('download-menu');
    
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      downloadMenu.classList.toggle('active');
      // Close the other dropdown
      langMenu.classList.remove('active');
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
      downloadMenu.classList.remove('active');
      langMenu.classList.remove('active');
    });
    
    // Handle format selection
    document.querySelectorAll('#download-menu button[data-format]').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        const format = item.getAttribute('data-format');
        downloadMenu.classList.remove('active');
        
        switch(format) {
          case 'pdf':
            await downloadPDF(invoice, currentLang);
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
    
    // PDF download function — captures the visible on-screen invoice
    async function downloadPDF(invoice, lang = 'en') {
      const invoiceNumber = invoice.invoiceNumber || 'export';
      const invoiceDoc = document.getElementById('invoice-document');
      
      // Convert SVG logo to PNG via canvas so html2canvas renders it correctly
      const logoImg = invoiceDoc.querySelector('.invoice-logo-img');
      let originalLogoSrc = null;
      if (logoImg) {
        originalLogoSrc = logoImg.src;
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
        
        await html2pdf().set(opt).from(invoiceDoc).save();
        window.toast.success('PDF downloaded successfully');
      } catch (error) {
        console.error('Error generating PDF:', error);
        window.toast.error('Failed to generate PDF. Please try again.');
      } finally {
        // Restore original SVG logo
        if (logoImg && originalLogoSrc) {
          logoImg.src = originalLogoSrc;
          logoImg.style.display = '';
        }
      }
    }
    
  } catch (error) {
    console.error('Error loading invoice:', error);
    renderPageWithLayout('<div class="error">Failed to load invoice</div>', 'buyer');
  }
}


// Removed renderPage1 function - now using renderInvoiceHtml for all rendering

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
      thankYou: 'Thank you for your business!',
      phoneNumber: 'Phone Number', emailLabel: 'Email'
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
      thankYou: '感谢您的惠顾！',
      phoneNumber: '电话号码', emailLabel: '电子邮件'
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
      thankYou: 'شكراً لتعاملكم معنا!',
      phoneNumber: 'رقم الهاتف', emailLabel: 'البريد الإلكتروني'
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
      thankYou: 'آپ کے کاروبار کا شکریہ!',
      phoneNumber: 'فون نمبر', emailLabel: 'ای میل'
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
            <p>${t.phoneNumber}: ${escapeHtml(invoice.sellerPhone || '008613332800284')}</p>
            <p>${t.emailLabel}: ${escapeHtml(invoice.sellerEmail || 'contactus@ione.live')}</p>
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
            ${invoice.buyerPhone ? `<p>${t.phoneNumber}: ${escapeHtml(invoice.buyerPhone)}</p>` : ''}
            <p>${t.emailLabel}: ${escapeHtml(invoice.buyerEmail || 'N/A')}</p>
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
          ${(invoice.termsAndConditions || DEFAULT_TERMS_BY_LANG[lang] || DEFAULT_TERMS_BY_LANG.en).map(term => `<li>${escapeHtml(term)}</li>`).join('')}
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
