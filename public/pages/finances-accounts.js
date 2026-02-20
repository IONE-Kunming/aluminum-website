import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import languageManager from '../js/language.js';
import { escapeHtml, formatCurrency } from '../js/utils.js';

const DEFAULT_ACCOUNTS = [
  { code: '1000', name: 'Cash', type: 'Asset', normalBalance: 'Debit', balance: 0 },
  { code: '1100', name: 'Accounts Receivable', type: 'Asset', normalBalance: 'Debit', balance: 0 },
  { code: '1200', name: 'Inventory', type: 'Asset', normalBalance: 'Debit', balance: 0 },
  { code: '2000', name: 'Accounts Payable', type: 'Liability', normalBalance: 'Credit', balance: 0 },
  { code: '2100', name: 'Tax Payable', type: 'Liability', normalBalance: 'Credit', balance: 0 },
  { code: '3000', name: 'Owner\'s Equity', type: 'Equity', normalBalance: 'Credit', balance: 0 },
  { code: '4000', name: 'Sales Revenue', type: 'Revenue', normalBalance: 'Credit', balance: 0 },
  { code: '4100', name: 'Shipping Revenue', type: 'Revenue', normalBalance: 'Credit', balance: 0 },
  { code: '5000', name: 'Cost of Goods Sold', type: 'Expense', normalBalance: 'Debit', balance: 0 },
  { code: '5100', name: 'Shipping Expenses', type: 'Expense', normalBalance: 'Debit', balance: 0 },
  { code: '5200', name: 'Platform Fees', type: 'Expense', normalBalance: 'Debit', balance: 0 },
];

const TYPE_COLORS = {
  Asset: '#1976d2', Liability: '#d32f2f', Equity: '#7b1fa2',
  Revenue: '#388e3c', Expense: '#f57c00'
};

export async function renderFinancesAccounts() {
  const profile = authManager.getUserProfile();
  const role = profile?.role || 'buyer';

  const content = `
    <div class="invoices-page">
      <div class="page-header">
        <div>
          <h1><i data-lucide="book-open"></i> Chart of Accounts</h1>
          <p>Manage your account structure</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary" id="coa-import-btn"><i data-lucide="upload"></i> Import CSV</button>
          <button class="btn btn-secondary" id="coa-export-btn"><i data-lucide="download"></i> Export CSV</button>
          <button class="btn btn-primary" id="coa-add-btn"><i data-lucide="plus"></i> Add Account</button>
        </div>
      </div>

      <div class="admin-controls">
        <div class="search-box">
          <i data-lucide="search"></i>
          <input type="text" id="coa-search" placeholder="Search accounts..." />
        </div>
        <div class="filter-controls">
          <select id="coa-type-filter">
            <option value="">All Types</option>
            <option value="Asset">Assets</option>
            <option value="Liability">Liabilities</option>
            <option value="Equity">Equity</option>
            <option value="Revenue">Revenue</option>
            <option value="Expense">Expenses</option>
          </select>
        </div>
      </div>

      <div id="coa-container">
        <!-- Accounts table rendered here -->
      </div>
    </div>
  `;

  renderPageWithLayout(content, role);
  if (window.lucide) window.lucide.createIcons();

  displayAccounts(DEFAULT_ACCOUNTS);

  document.getElementById('coa-search')?.addEventListener('input', () => {
    const q = (document.getElementById('coa-search')?.value || '').toLowerCase();
    const typeFilter = document.getElementById('coa-type-filter')?.value || '';
    let filtered = DEFAULT_ACCOUNTS;
    if (q) filtered = filtered.filter(a => a.code.includes(q) || a.name.toLowerCase().includes(q));
    if (typeFilter) filtered = filtered.filter(a => a.type === typeFilter);
    displayAccounts(filtered);
  });

  document.getElementById('coa-type-filter')?.addEventListener('change', () => {
    document.getElementById('coa-search')?.dispatchEvent(new Event('input'));
  });

  document.getElementById('coa-export-btn')?.addEventListener('click', () => {
    const header = 'Code,Name,Type,Normal Balance,Balance\n';
    const rows = DEFAULT_ACCOUNTS.map(a => `${a.code},${a.name},${a.type},${a.normalBalance},${a.balance}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart-of-accounts.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.toast.success('Chart of accounts exported');
  });

  document.getElementById('coa-add-btn')?.addEventListener('click', () => {
    window.toast.info('Add account feature coming soon');
  });

  document.getElementById('coa-import-btn')?.addEventListener('click', () => {
    window.toast.info('Import chart of accounts feature coming soon');
  });
}

function displayAccounts(accounts) {
  const container = document.getElementById('coa-container');
  if (!container) return;

  container.innerHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Account Name</th>
            <th>Type</th>
            <th>Normal Balance</th>
            <th>Current Balance</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${accounts.map(a => `
            <tr>
              <td class="font-medium">${escapeHtml(a.code)}</td>
              <td>${escapeHtml(a.name)}</td>
              <td><span style="color: ${TYPE_COLORS[a.type] || '#333'}; font-weight: 600;">${escapeHtml(a.type)}</span></td>
              <td>${escapeHtml(a.normalBalance)}</td>
              <td>${formatCurrency(a.balance)}</td>
              <td class="actions">
                <button class="btn-icon" title="View Activity"><i data-lucide="eye"></i></button>
                <button class="btn-icon" title="Edit"><i data-lucide="edit"></i></button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
}
