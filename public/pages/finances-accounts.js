import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import languageManager from '../js/language.js';
import { escapeHtml, formatCurrency } from '../js/utils.js';

function getDefaultAccounts(t) {
  return [
    { code: '1000', name: t('finances.accountCash'), type: 'Asset', normalBalance: 'Debit', balance: 0 },
    { code: '1100', name: t('finances.accountReceivable'), type: 'Asset', normalBalance: 'Debit', balance: 0 },
    { code: '1200', name: t('finances.accountInventory'), type: 'Asset', normalBalance: 'Debit', balance: 0 },
    { code: '2000', name: t('finances.accountPayable'), type: 'Liability', normalBalance: 'Credit', balance: 0 },
    { code: '2100', name: t('finances.accountTaxPayable'), type: 'Liability', normalBalance: 'Credit', balance: 0 },
    { code: '3000', name: t('finances.accountOwnersEquity'), type: 'Equity', normalBalance: 'Credit', balance: 0 },
    { code: '4000', name: t('finances.accountSalesRevenue'), type: 'Revenue', normalBalance: 'Credit', balance: 0 },
    { code: '4100', name: t('finances.accountShippingRevenue'), type: 'Revenue', normalBalance: 'Credit', balance: 0 },
    { code: '5000', name: t('finances.accountCogs'), type: 'Expense', normalBalance: 'Debit', balance: 0 },
    { code: '5100', name: t('finances.accountShippingExpenses'), type: 'Expense', normalBalance: 'Debit', balance: 0 },
    { code: '5200', name: t('finances.accountPlatformFees'), type: 'Expense', normalBalance: 'Debit', balance: 0 },
  ];
}

const TYPE_COLORS = {
  Asset: '#1976d2', Liability: '#d32f2f', Equity: '#7b1fa2',
  Revenue: '#388e3c', Expense: '#f57c00'
};

export async function renderFinancesAccounts() {
  const t = languageManager.t.bind(languageManager);
  const profile = authManager.getUserProfile();
  const role = profile?.role || 'buyer';
  const defaultAccounts = getDefaultAccounts(t);

  const content = `
    <div class="invoices-page">
      <div class="page-header">
        <div>
          <h1><i data-lucide="book-open"></i> ${t('finances.chartOfAccounts')}</h1>
          <p>${t('finances.manageAccountStructure')}</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary" id="coa-import-btn"><i data-lucide="upload"></i> ${t('finances.importCsv')}</button>
          <button class="btn btn-secondary" id="coa-export-btn"><i data-lucide="download"></i> ${t('finances.exportCsv')}</button>
          <button class="btn btn-primary" id="coa-add-btn"><i data-lucide="plus"></i> ${t('finances.addAccount')}</button>
        </div>
      </div>

      <div class="admin-controls">
        <div class="search-box">
          <i data-lucide="search"></i>
          <input type="text" id="coa-search" placeholder="${t('finances.searchAccountsPlaceholder')}" />
        </div>
        <div class="filter-controls">
          <select id="coa-type-filter">
            <option value="">${t('finances.allTypes')}</option>
            <option value="Asset">${t('finances.assets')}</option>
            <option value="Liability">${t('finances.liabilities')}</option>
            <option value="Equity">${t('finances.equity')}</option>
            <option value="Revenue">${t('finances.revenue')}</option>
            <option value="Expense">${t('finances.expenses')}</option>
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

  displayAccounts(defaultAccounts, t);

  document.getElementById('coa-search')?.addEventListener('input', () => {
    const q = (document.getElementById('coa-search')?.value || '').toLowerCase();
    const typeFilter = document.getElementById('coa-type-filter')?.value || '';
    let filtered = defaultAccounts;
    if (q) filtered = filtered.filter(a => a.code.includes(q) || a.name.toLowerCase().includes(q));
    if (typeFilter) filtered = filtered.filter(a => a.type === typeFilter);
    displayAccounts(filtered, t);
  });

  document.getElementById('coa-type-filter')?.addEventListener('change', () => {
    document.getElementById('coa-search')?.dispatchEvent(new Event('input'));
  });

  document.getElementById('coa-export-btn')?.addEventListener('click', () => {
    const header = 'Code,Name,Type,Normal Balance,Balance\n';
    const rows = defaultAccounts.map(a => `${a.code},${a.name},${a.type},${a.normalBalance},${a.balance}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart-of-accounts.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.toast.success(t('finances.chartOfAccountsExported'));
  });

  document.getElementById('coa-add-btn')?.addEventListener('click', () => {
    window.toast.info(t('finances.addAccountComingSoon'));
  });

  document.getElementById('coa-import-btn')?.addEventListener('click', () => {
    window.toast.info(t('finances.importAccountsComingSoon'));
  });
}

function displayAccounts(accounts, t) {
  const container = document.getElementById('coa-container');
  if (!container) return;

  container.innerHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>${t('finances.code')}</th>
            <th>${t('finances.accountName')}</th>
            <th>${t('finances.type')}</th>
            <th>${t('finances.normalBalance')}</th>
            <th>${t('finances.currentBalance')}</th>
            <th>${t('finances.actions')}</th>
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
                <button class="btn-icon" title="${t('finances.viewActivity')}"><i data-lucide="eye"></i></button>
                <button class="btn-icon" title="${t('finances.edit')}"><i data-lucide="edit"></i></button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
}
