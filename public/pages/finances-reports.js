import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import languageManager from '../js/language.js';
import { escapeHtml } from '../js/utils.js';

const REPORT_CARDS = [
  { id: 'pnl', icon: 'trending-up', name: 'Profit & Loss', description: 'Revenue, expenses, and net income over a period', color: '#388e3c' },
  { id: 'balance', icon: 'scale', name: 'Balance Sheet', description: 'Assets, liabilities, and equity at a point in time', color: '#1976d2' },
  { id: 'cashflow', icon: 'activity', name: 'Cash Flow Statement', description: 'Cash inflows and outflows from operations', color: '#7b1fa2' },
  { id: 'trial', icon: 'clipboard-list', name: 'Trial Balance', description: 'Summary of all account balances', color: '#f57c00' },
  { id: 'product-profit', icon: 'package', name: 'Profit by Product', description: 'Profitability analysis per product', color: '#0097a7' },
  { id: 'category-profit', icon: 'layers', name: 'Profit by Category', description: 'Revenue and profit grouped by category', color: '#5c6bc0' },
  { id: 'tax-liability', icon: 'file-text', name: 'Tax Liability Report', description: 'Tax collected and amounts due', color: '#d32f2f' },
  { id: 'ar-aging', icon: 'clock', name: 'Accounts Receivable Aging', description: 'Outstanding receivables by age', color: '#00897b' },
  { id: 'ap-aging', icon: 'timer', name: 'Accounts Payable Aging', description: 'Outstanding payables by age', color: '#8d6e63' },
  { id: 'refund', icon: 'rotate-ccw', name: 'Refund Analysis', description: 'Refund trends and reasons', color: '#e53935' },
];

export async function renderFinancesReports() {
  const profile = authManager.getUserProfile();
  const role = profile?.role || 'buyer';

  const content = `
    <div class="invoices-page">
      <div class="page-header">
        <h1><i data-lucide="bar-chart-2"></i> Reports Center</h1>
        <p>Generate and view financial reports</p>
      </div>

      <div class="stats-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
        ${REPORT_CARDS.map(card => `
          <div class="stat-card" style="cursor: pointer; padding: 24px;" data-report="${card.id}">
            <div class="stat-icon" style="background-color: ${card.color}20;">
              <i data-lucide="${card.icon}" style="color: ${card.color};"></i>
            </div>
            <div class="stat-content">
              <h3 style="margin-bottom: 4px;">${escapeHtml(card.name)}</h3>
              <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 12px;">${escapeHtml(card.description)}</p>
              <div style="display: flex; gap: 8px; align-items: center;">
                <button class="btn btn-primary btn-sm">Run Report</button>
                <span style="font-size: 11px; color: var(--text-secondary);">Last: Never</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  renderPageWithLayout(content, role);
  if (window.lucide) window.lucide.createIcons();

  document.querySelectorAll('[data-report]').forEach(card => {
    card.addEventListener('click', () => {
      const reportId = card.getAttribute('data-report');
      const reportName = REPORT_CARDS.find(r => r.id === reportId)?.name || 'Report';
      window.toast.info(`${reportName} — report generation coming soon`);
    });
  });
}
