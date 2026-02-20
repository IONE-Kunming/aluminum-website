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
        <h1><i data-lucide="list"></i> Transactions</h1>
        <p>View all financial transactions</p>
      </div>

      <div class="admin-controls">
        <div class="search-box">
          <i data-lucide="search"></i>
          <input type="text" id="txn-search" placeholder="Search by reference, description, or amount..." />
        </div>
        <div class="filter-controls">
          <select id="txn-type-filter">
            <option value="">All Types</option>
            <option value="sale">Sale</option>
            <option value="refund">Refund</option>
            <option value="expense">Expense</option>
          </select>
          <select id="txn-status-filter">
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button class="btn btn-secondary" id="txn-export-btn">
            <i data-lucide="download"></i> Export
          </button>
        </div>
      </div>

      <div id="txn-loading" class="loading-spinner">
        <i data-lucide="loader"></i> Loading transactions...
      </div>

      <div id="txn-container" style="display:none;">
        <!-- Transactions table rendered here -->
      </div>
    </div>
  `;

  renderPageWithLayout(content, role);
  if (window.lucide) window.lucide.createIcons();

  await loadTransactions(role);

  document.getElementById('txn-search')?.addEventListener('input', () => filterTransactions());
  document.getElementById('txn-type-filter')?.addEventListener('change', () => filterTransactions());
  document.getElementById('txn-status-filter')?.addEventListener('change', () => filterTransactions());
  document.getElementById('txn-export-btn')?.addEventListener('click', exportTransactions);
}

let allTransactions = [];

async function loadTransactions(role) {
  try {
    await dataService.init();
    const uid = authManager.getCurrentUser()?.uid;

    let ordersQuery = dataService.db.collection('orders');
    if (role === 'seller') ordersQuery = ordersQuery.where('sellerId', '==', uid);
    else if (role === 'buyer') ordersQuery = ordersQuery.where('buyerId', '==', uid);

    const snap = await ordersQuery.orderBy('createdAt', 'desc').limit(200).get();
    allTransactions = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    displayTransactions(allTransactions);
  } catch (err) {
    console.error('Error loading transactions:', err);
    document.getElementById('txn-loading').innerHTML = '<div class="error">Failed to load transactions</div>';
  }
}

function displayTransactions(txns) {
  const container = document.getElementById('txn-container');
  const loading = document.getElementById('txn-loading');
  loading.style.display = 'none';
  container.style.display = 'block';

  if (txns.length === 0) {
    container.innerHTML = `<div class="empty-state"><i data-lucide="inbox"></i><p>No transactions found</p></div>`;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Reference</th>
            <th>Description</th>
            <th>Account</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Status</th>
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
                <td>${escapeHtml(txn.productName || txn.description || 'Order')}</td>
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
    <p style="text-align:center;color:var(--text-secondary);margin-top:12px;">Showing ${Math.min(txns.length, PAGE_SIZE)} of ${txns.length} transactions</p>
  `;
  if (window.lucide) window.lucide.createIcons();
}

function filterTransactions() {
  const search = (document.getElementById('txn-search')?.value || '').toLowerCase();
  const typeFilter = document.getElementById('txn-type-filter')?.value || '';
  const statusFilter = document.getElementById('txn-status-filter')?.value || '';

  let filtered = allTransactions;
  if (search) {
    filtered = filtered.filter(t =>
      (t.id && t.id.toLowerCase().includes(search)) ||
      (t.productName && t.productName.toLowerCase().includes(search)) ||
      (t.description && t.description.toLowerCase().includes(search)) ||
      String(t.total || t.amount || '').includes(search)
    );
  }
  if (statusFilter) {
    filtered = filtered.filter(t => (t.status || '').toLowerCase() === statusFilter);
  }
  displayTransactions(filtered);
}

function exportTransactions() {
  if (allTransactions.length === 0) {
    window.toast.info('No transactions to export');
    return;
  }
  const header = 'Date,Reference,Description,Amount,Status\n';
  const rows = allTransactions.map(t =>
    `${formatDate(t.createdAt)},${t.id?.substring(0, 8) || ''},${(t.productName || t.description || 'Order').replace(/,/g, ' ')},${(t.total || t.amount || 0).toFixed(2)},${t.status || 'pending'}`
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
  window.toast.success('Transactions exported');
}
