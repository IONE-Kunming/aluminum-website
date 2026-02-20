import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import languageManager from '../js/language.js';
import { escapeHtml, formatCurrency, formatDate } from '../js/utils.js';
import dataService from '../js/dataService.js';

export async function renderFinancesReconciliation() {
  const profile = authManager.getUserProfile();
  const role = profile?.role || 'buyer';
  const uid = authManager.getCurrentUser()?.uid;

  // Load recent invoices for reconciliation
  let invoices = [];
  try {
    await dataService.init();
    if (dataService.db) {
      let query = dataService.db.collection('invoices');
      if (role === 'seller') query = query.where('sellerId', '==', uid);
      else if (role === 'buyer') query = query.where('buyerId', '==', uid);
      const snap = await query.orderBy('createdAt', 'desc').limit(30).get();
      invoices = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  } catch (err) {
    console.error('Error loading reconciliation data:', err);
  }

  const totalInvoiced = invoices.reduce((s, i) => s + (i.total || i.amount || 0), 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || i.amount || 0), 0);
  const difference = totalInvoiced - totalPaid;

  const content = `
    <div class="invoices-page">
      <div class="page-header">
        <h1><i data-lucide="check-square"></i> Reconciliation</h1>
        <p>Match and reconcile transactions with bank statements</p>
      </div>

      <!-- Bank Account Selector -->
      <div style="display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; align-items: center;">
        <div class="form-group" style="margin:0;">
          <label style="font-size:13px;margin-bottom:4px;">Bank Account</label>
          <select class="form-control" id="recon-account" style="min-width: 220px;">
            <option value="primary">Primary Bank Account</option>
            <option value="secondary">Secondary Account</option>
          </select>
        </div>
        <div style="display: flex; gap: 24px; align-items: center;">
          <div>
            <span style="font-size:12px;color:var(--text-secondary);display:block;">Total Invoiced</span>
            <span style="font-weight:700;font-size:18px;">${formatCurrency(totalInvoiced)}</span>
          </div>
          <div>
            <span style="font-size:12px;color:var(--text-secondary);display:block;">Total Paid</span>
            <span style="font-weight:700;font-size:18px;color:#388e3c;">${formatCurrency(totalPaid)}</span>
          </div>
          <div>
            <span style="font-size:12px;color:var(--text-secondary);display:block;">Difference</span>
            <span style="font-weight:700;font-size:18px;color:${difference > 0 ? '#d32f2f' : '#388e3c'};">${formatCurrency(difference)}</span>
          </div>
        </div>
      </div>

      <!-- Progress -->
      <div style="margin-bottom: 24px; padding: 16px; background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 600;">Reconciliation Progress</span>
          <span style="font-size: 13px; color: var(--text-secondary);">
            ${invoices.filter(i => i.status === 'paid').length} / ${invoices.length} matched
          </span>
        </div>
        <div style="height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
          <div style="height: 100%; width: ${invoices.length > 0 ? Math.round((invoices.filter(i => i.status === 'paid').length / invoices.length) * 100) : 0}%; background: #388e3c; border-radius: 4px;"></div>
        </div>
      </div>

      <!-- Statement Upload -->
      <div style="margin-bottom: 24px; display: flex; gap: 12px; align-items: center;">
        <button class="btn btn-secondary" id="recon-upload-btn">
          <i data-lucide="upload"></i> Upload Bank Statement (CSV)
        </button>
        <button class="btn btn-primary" id="recon-complete-btn">
          <i data-lucide="check-circle"></i> Complete Reconciliation
        </button>
      </div>

      <!-- System Transactions -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 40px;"><input type="checkbox" id="recon-select-all" /></th>
              <th>Date</th>
              <th>Invoice #</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${invoices.length === 0
              ? '<tr><td colspan="6" style="text-align:center;padding:24px;opacity:0.6;">No invoices available for reconciliation.</td></tr>'
              : invoices.map(inv => `
                <tr>
                  <td><input type="checkbox" class="recon-check" data-id="${escapeHtml(inv.id)}" ${inv.status === 'paid' ? 'checked disabled' : ''} /></td>
                  <td>${formatDate(inv.createdAt)}</td>
                  <td class="font-medium">${escapeHtml(inv.invoiceNumber || inv.id?.substring(0, 8) || 'N/A')}</td>
                  <td>${escapeHtml(inv.buyerCompany || inv.buyerName || 'Invoice')}</td>
                  <td class="font-medium">${formatCurrency(inv.total || inv.amount || 0)}</td>
                  <td><span class="status-badge ${inv.status === 'paid' ? 'status-delivered' : 'status-pending'}">${escapeHtml(inv.status || 'pending')}</span></td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  renderPageWithLayout(content, role);
  if (window.lucide) window.lucide.createIcons();

  document.getElementById('recon-select-all')?.addEventListener('change', (e) => {
    document.querySelectorAll('.recon-check:not(:disabled)').forEach(cb => { cb.checked = e.target.checked; });
  });

  document.getElementById('recon-upload-btn')?.addEventListener('click', () => {
    window.toast.info('Bank statement upload coming soon');
  });

  document.getElementById('recon-complete-btn')?.addEventListener('click', () => {
    const checked = document.querySelectorAll('.recon-check:checked:not(:disabled)');
    if (checked.length === 0) {
      window.toast.error('Please select at least one transaction to reconcile');
      return;
    }
    window.toast.success(`${checked.length} transaction(s) marked for reconciliation`);
  });
}
