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

  const content = `
    <div class="invoices-page">
      <div class="page-header">
        <h1>${t('invoices.title')}</h1>
        <p>${t('invoices.subtitle')}</p>
      </div>

      <!-- Accounting Summary -->
      <div class="accounting-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">Total Invoices</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">${invoices.length}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">Total Revenue</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">$${totalRevenue.toFixed(2)}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">Amount Collected</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">$${totalCollected.toFixed(2)}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">Outstanding</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">$${totalOutstanding.toFixed(2)}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">Paid Invoices</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">${paidCount}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">Pending Invoices</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">${pendingCount}</p>
        </div>
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
      const invoice = invoices.find(inv => inv.id === invoiceId);
      showPaymentProofModal(invoiceId, invoice?.invoiceNumber || invoiceId);
    });
  });
  
  document.querySelectorAll('.invoice-card').forEach(card => {
    card.addEventListener('click', () => {
      const invoiceId = card.dataset.invoiceId;
      router.navigate(`/seller/invoice?id=${invoiceId}`);
    });
  });
}


function showPaymentProofModal(invoiceId, invoiceNumber) {
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
      await dataService.db.collection('invoices').doc(invoiceId).update({
        status: 'paid',
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
