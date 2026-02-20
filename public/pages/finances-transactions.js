import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import languageManager from '../js/language.js';
import { escapeHtml, formatCurrency, formatDate } from '../js/utils.js';

const PAGE_SIZE = 50;

function getStatusClass(status) {
  const map = {
    completed: 'status-delivered', paid: 'status-delivered',
    pending: 'status-pending', processing: 'status-transit',
    cancelled: 'status-pending', void: 'status-pending',
  };
  return map[status?.toLowerCase()] || 'status-pending';
}

export async function renderFinancesTransactions() {
  const profile = authManager.getUserProfile();
  const role = profile?.role || 'buyer';
  const t = languageManager.t.bind(languageManager);

  const content = `
    <div class="invoices-page">
      <div class="page-header">
        <h1><i data-lucide="list"></i> ${t('finances.transactions')}</h1>
        <p>${t('finances.viewAllTransactions')}</p>
      </div>

      <div class="admin-controls">
        <div class="search-box">
          <i data-lucide="search"></i>
          <input type="text" id="txn-search" placeholder="${t('finances.searchTransactionsPlaceholder')}" />
        </div>
        <div class="filter-controls">
          <select id="txn-type-filter">
            <option value="">${t('finances.allTypes')}</option>
            <option value="sale">${t('finances.sale')}</option>
            <option value="refund">${t('finances.refund')}</option>
            <option value="expense">${t('finances.expense')}</option>
          </select>
          <select id="txn-status-filter">
            <option value="">${t('finances.allStatus')}</option>
            <option value="completed">${t('finances.completed')}</option>
            <option value="pending">${t('finances.pending')}</option>
            <option value="cancelled">${t('finances.cancelled')}</option>
          </select>
          <button class="btn btn-secondary" id="txn-export-btn">
            <i data-lucide="download"></i> ${t('finances.export')}
          </button>
        </div>
      </div>

      <div id="txn-loading" class="loading-spinner">
        <i data-lucide="loader"></i> ${t('finances.loadingTransactions')}
      </div>

      <div id="txn-container" style="display:none;">
        <!-- Transactions table rendered here -->
      </div>
    </div>
  `;

  renderPageWithLayout(content, role);
  if (window.lucide) window.lucide.createIcons();

  await loadTransactions(role, t);

  document.getElementById('txn-search')?.addEventListener('input', () => filterTransactions(t));
  document.getElementById('txn-type-filter')?.addEventListener('change', () => filterTransactions(t));
  document.getElementById('txn-status-filter')?.addEventListener('change', () => filterTransactions(t));
  document.getElementById('txn-export-btn')?.addEventListener('click', () => exportTransactions(t));
}

let allTransactions = [];

async function loadTransactions(role, t) {
  try {
    await dataService.init();
    const uid = authManager.getCurrentUser()?.uid;

    let ordersQuery = dataService.db.collection('orders');
    if (role === 'seller') ordersQuery = ordersQuery.where('sellerId', '==', uid);
    else if (role === 'buyer') ordersQuery = ordersQuery.where('buyerId', '==', uid);

    const snap = await ordersQuery.orderBy('createdAt', 'desc').limit(200).get();
    allTransactions = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    displayTransactions(allTransactions, t);
  } catch (err) {
    console.error('Error loading transactions:', err);
    document.getElementById('txn-loading').innerHTML = `<div class="error">${t('finances.failedToLoadTransactions')}</div>`;
  }
}

function displayTransactions(txns, t) {
  const container = document.getElementById('txn-container');
  const loading = document.getElementById('txn-loading');
  loading.style.display = 'none';
  container.style.display = 'block';

  if (txns.length === 0) {
    container.innerHTML = `<div class="empty-state"><i data-lucide="inbox"></i><p>${t('finances.noTransactionsFound')}</p></div>`;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>${t('finances.date')}</th>
            <th>${t('finances.reference')}</th>
            <th>${t('finances.description')}</th>
            <th>${t('finances.account')}</th>
            <th>${t('finances.debit')}</th>
            <th>${t('finances.credit')}</th>
            <th>${t('finances.status')}</th>
          </tr>
        </thead>
        <tbody>
          ${txns.slice(0, PAGE_SIZE).map(txn => {
            const amount = txn.total || txn.amount || 0;
            const isCredit = (txn.status === 'completed' || txn.status === 'paid');
            return `
              <tr>
                <td>${formatDate(txn.createdAt)}</td>
                <td class="font-medium">${escapeHtml(txn.id?.substring(0, 8) || 'N/A')}</td>
                <td>${escapeHtml(txn.productName || txn.description || t('finances.order'))}</td>
                <td>${escapeHtml(txn.paymentMethod || 'N/A')}</td>
                <td>${!isCredit ? formatCurrency(amount) : '-'}</td>
                <td>${isCredit ? formatCurrency(amount) : '-'}</td>
                <td><span class="status-badge ${getStatusClass(txn.status)}">${escapeHtml(txn.status || 'pending')}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    <p style="text-align:center;color:var(--text-secondary);margin-top:12px;">${t('finances.showingTransactions').replace('{shown}', Math.min(txns.length, PAGE_SIZE)).replace('{total}', txns.length)}</p>
  `;
  if (window.lucide) window.lucide.createIcons();
}

function filterTransactions(t) {
  const search = (document.getElementById('txn-search')?.value || '').toLowerCase();
  const typeFilter = document.getElementById('txn-type-filter')?.value || '';
  const statusFilter = document.getElementById('txn-status-filter')?.value || '';

  let filtered = allTransactions;
  if (search) {
    filtered = filtered.filter(txn =>
      (txn.id && txn.id.toLowerCase().includes(search)) ||
      (txn.productName && txn.productName.toLowerCase().includes(search)) ||
      (txn.description && txn.description.toLowerCase().includes(search)) ||
      String(txn.total || txn.amount || '').includes(search)
    );
  }
  if (statusFilter) {
    filtered = filtered.filter(txn => (txn.status || '').toLowerCase() === statusFilter);
  }
  displayTransactions(filtered, t);
}

function exportTransactions(t) {
  if (allTransactions.length === 0) {
    window.toast.info(t('finances.noTransactionsToExport'));
    return;
  }
  const header = 'Date,Reference,Description,Amount,Status\n';
  const rows = allTransactions.map(txn =>
    `${formatDate(txn.createdAt)},${txn.id?.substring(0, 8) || ''},${(txn.productName || txn.description || t('finances.order')).replace(/,/g, ' ')},${(txn.total || txn.amount || 0).toFixed(2)},${txn.status || 'pending'}`
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transactions.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  window.toast.success(t('finances.transactionsExported'));
}
