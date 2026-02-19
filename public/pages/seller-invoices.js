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
  
  const totalRevenue = invoices.reduce((s, inv) => s + (inv.total || 0), 0);
  const totalCollected = invoices.reduce((s, inv) => s + (inv.depositPaid || 0), 0);
  const totalOutstanding = invoices.reduce((s, inv) => s + (inv.remainingBalance || 0), 0);
  const paidCount = invoices.filter(inv => inv.status === 'paid').length;
  const pendingCount = invoices.length - paidCount;

  const PAGE_SIZE = 10;
  let currentPage = 1;
  let lastFiltered = invoices;

  const renderInvoicesList = (list, page = 1) => {
    const container = document.querySelector('.invoices-list-container');
    if (!container) return;

    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    page = Math.min(Math.max(1, page), totalPages);
    const start = (page - 1) * PAGE_SIZE;
    const pageInvoices = list.slice(start, start + PAGE_SIZE);

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="file-text" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>${t('invoices.noInvoices')}</h2>
          <p>${t('invoices.invoicesWillAppear')}</p>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="invoices-table-wrapper" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
                <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px;">${t('invoices.invoiceNumber')}</th>
                <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px;">${t('orders.date') || 'Date'}</th>
                <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px;">${t('invoices.customer') || 'Buyer'}</th>
                <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px; text-align: right;">${t('invoices.received') || 'Amount Paid'}</th>
                <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px; text-align: right;">${t('invoices.balanceDue') || 'Remaining'}</th>
                <th style="padding: 10px 12px;"></th>
              </tr>
            </thead>
            <tbody>
              ${pageInvoices.map(invoice => `
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 12px; font-weight: 600; font-size: 14px;">${escapeHtml(invoice.invoiceNumber)}</td>
                  <td style="padding: 12px; color: var(--text-secondary); font-size: 13px;">${formatDate(invoice.createdAt)}</td>
                  <td style="padding: 12px; font-size: 14px;">${escapeHtml(invoice.buyerCompany || invoice.buyerName || 'N/A')}</td>
                  <td style="padding: 12px; text-align: right; font-size: 14px; color: var(--success-color);">$${(invoice.depositPaid || 0).toFixed(2)}</td>
                  <td style="padding: 12px; text-align: right; font-size: 14px; color: var(--warning-color);">$${(invoice.remainingBalance || 0).toFixed(2)}</td>
                  <td style="padding: 12px; text-align: right; white-space: nowrap;">
                    <button class="btn btn-secondary btn-sm view-invoice-btn" data-invoice-id="${invoice.id}" style="margin-right: 6px;">
                      ${t('invoices.viewDetails')}
                    </button>
                    ${invoice.status !== 'paid' ? `
                      <button class="btn btn-primary btn-sm mark-paid-btn" data-invoice-id="${invoice.id}">
                        ${t('invoices.markAsPaid')}
                      </button>
                    ` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${totalPages > 1 ? `
        <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 20px; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-sm invoice-page-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>&#8249; ${t('common.previous') || 'Previous'}</button>
          <span style="font-size: 14px; color: var(--text-secondary);">${t('common.page') || 'Page'} ${page} ${t('common.of') || 'of'} ${totalPages}</span>
          <button class="btn btn-secondary btn-sm invoice-page-btn" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>${t('common.next') || 'Next'} &#8250;</button>
        </div>
        ` : ''}
      `;

      document.querySelectorAll('.view-invoice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const invoiceId = btn.dataset.invoiceId;
          router.navigate(`/seller/invoice?id=${invoiceId}`);
        });
      });

      document.querySelectorAll('.mark-paid-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const invoiceId = btn.dataset.invoiceId;
          const invoice = invoices.find(inv => inv.id === invoiceId);
          showPaymentProofModal(invoiceId, invoice?.invoiceNumber || invoiceId, invoice);
        });
      });

      document.querySelectorAll('.invoice-page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const newPage = parseInt(btn.dataset.page);
          currentPage = newPage;
          renderInvoicesList(lastFiltered, currentPage);
        });
      });
    }

    if (window.lucide) window.lucide.createIcons();
  };

  const content = `
    <div class="invoices-page">
      <div class="page-header">
        <h1>${t('invoices.title')}</h1>
        <p>${t('invoices.subtitle')}</p>
      </div>

      <!-- Accounting Summary -->
      <div class="accounting-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('invoices.totalInvoices') || 'Total Invoices'}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">${invoices.length}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('invoices.totalRevenue') || 'Total Revenue'}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">$${totalRevenue.toFixed(2)}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('invoices.amountCollected') || 'Amount Collected'}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">$${totalCollected.toFixed(2)}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('invoices.outstanding') || 'Outstanding'}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">$${totalOutstanding.toFixed(2)}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('invoices.paidInvoices') || 'Paid Invoices'}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">${paidCount}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('invoices.pendingInvoices') || 'Pending Invoices'}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">${pendingCount}</p>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="filter-section card" style="margin-bottom: 24px;">
        <div class="filter-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0;">${t('invoices.filterInvoices') || 'Filter Invoices'}</h3>
          <button class="btn btn-text btn-sm" id="resetFilters">
            <i data-lucide="x"></i>
            ${t('common.reset')}
          </button>
        </div>
        <div class="filter-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div class="form-group">
            <label>${t('invoices.invoiceNumber') || 'Invoice Number'}</label>
            <input type="text" id="filterInvoiceNumber" class="form-control" placeholder="${t('common.search') || 'Search'}...">
          </div>
          <div class="form-group">
            <label>${t('common.from') || 'From'}</label>
            <input type="date" id="filterDateFrom" class="form-control">
          </div>
          <div class="form-group">
            <label>${t('common.to') || 'To'}</label>
            <input type="date" id="filterDateTo" class="form-control">
          </div>
        </div>
      </div>

      <div class="invoices-list-container">
        <!-- Invoices will be rendered here -->
      </div>
    </div>
  `;
  
  renderPageWithLayout(content, 'seller');
  if (window.lucide) window.lucide.createIcons();

  // Initial render
  renderInvoicesList(invoices, 1);

  // Filter function
  const applyFilters = () => {
    const invoiceNumber = document.getElementById('filterInvoiceNumber')?.value.toLowerCase() || '';
    const dateFrom = document.getElementById('filterDateFrom')?.value || '';
    const dateTo = document.getElementById('filterDateTo')?.value || '';

    let filtered = invoices;

    if (invoiceNumber) {
      filtered = filtered.filter(inv =>
        (inv.invoiceNumber || '').toLowerCase().includes(invoiceNumber)
      );
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(inv => {
        const invDate = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt);
        return invDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(inv => {
        const invDate = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt);
        return invDate <= toDate;
      });
    }

    lastFiltered = filtered;
    currentPage = 1;
    renderInvoicesList(filtered, currentPage);
  };

  ['filterInvoiceNumber', 'filterDateFrom', 'filterDateTo'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', applyFilters);
      element.addEventListener('change', applyFilters);
    }
  });

  const resetButton = document.getElementById('resetFilters');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      ['filterInvoiceNumber', 'filterDateFrom', 'filterDateTo'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
      });
      lastFiltered = invoices;
      currentPage = 1;
      renderInvoicesList(invoices, currentPage);
    });
  }
}


function showPaymentProofModal(invoiceId, invoiceNumber, invoice = {}) {
  // Remove existing modal if any
  const existing = document.getElementById('payment-proof-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'payment-proof-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2><i data-lucide="upload"></i> Upload Payment Proof</h2>
        <button class="modal-close" id="close-payment-proof-modal"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <p>Invoice: <strong>${invoiceNumber}</strong></p>
        <div class="form-group">
          <label>Payment Proof (PDF) *</label>
          <input type="file" id="payment-proof-file" class="form-control" accept=".pdf" required />
          <small style="color: var(--text-secondary);">Please upload the payment receipt or bank transfer confirmation as PDF</small>
        </div>
        <div id="upload-progress" style="display: none; margin-top: 12px;">
          <p style="color: var(--text-secondary); font-size: 14px;"><i data-lucide="loader"></i> Uploading...</p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancel-payment-proof">Cancel</button>
        <button class="btn btn-primary" id="submit-payment-proof">
          <i data-lucide="upload"></i> Upload &amp; Mark as Paid
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();

  const closeModal = () => modal.remove();

  document.getElementById('close-payment-proof-modal').addEventListener('click', closeModal);
  document.getElementById('cancel-payment-proof').addEventListener('click', closeModal);

  document.getElementById('submit-payment-proof').addEventListener('click', async () => {
    const fileInput = document.getElementById('payment-proof-file');
    const file = fileInput?.files?.[0];
    if (!file) {
      window.toast?.error('Please select a PDF file');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      window.toast?.error('Please upload a PDF file');
      return;
    }

    const progressEl = document.getElementById('upload-progress');
    const submitBtn = document.getElementById('submit-payment-proof');
    progressEl.style.display = 'block';
    submitBtn.disabled = true;

    try {
      const user = authManager.getCurrentUser();
      const uid = user?.uid || 'unknown';
      const randomId = Math.random().toString(36).substring(2, 10);
      const storageRef = firebase.storage().ref(`payment-proofs/${uid}/${invoiceId}_${Date.now()}_${randomId}.pdf`);
      const uploadTask = await storageRef.put(file);
      const paymentProofUrl = await uploadTask.ref.getDownloadURL();

      await dataService.init();
      const totalAmount = invoice.total || 0;
      await dataService.db.collection('invoices').doc(invoiceId).update({
        status: 'paid',
        depositPaid: totalAmount,
        remainingBalance: 0,
        paymentProofUrl,
        paymentProofUploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
        paidAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      window.toast?.success('Invoice marked as paid and proof uploaded');
      closeModal();
      renderSellerInvoices();
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      window.toast?.error('Failed to upload payment proof: ' + error.message);
      progressEl.style.display = 'none';
      submitBtn.disabled = false;
    }
  });
}
