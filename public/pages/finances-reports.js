import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import languageManager from '../js/language.js';
import { escapeHtml } from '../js/utils.js';

function getReportCards(t) {
  return [
    { id: 'pnl', icon: 'trending-up', name: t('finances.profitAndLoss'), description: t('finances.profitAndLossDesc'), color: '#388e3c' },
    { id: 'balance', icon: 'scale', name: t('finances.balanceSheet'), description: t('finances.balanceSheetDesc'), color: '#1976d2' },
    { id: 'cashflow', icon: 'activity', name: t('finances.cashFlowStatement'), description: t('finances.cashFlowStatementDesc'), color: '#7b1fa2' },
    { id: 'trial', icon: 'clipboard-list', name: t('finances.trialBalance'), description: t('finances.trialBalanceDesc'), color: '#f57c00' },
    { id: 'product-profit', icon: 'package', name: t('finances.profitByProduct'), description: t('finances.profitByProductDesc'), color: '#0097a7' },
    { id: 'category-profit', icon: 'layers', name: t('finances.profitByCategory'), description: t('finances.profitByCategoryDesc'), color: '#5c6bc0' },
    { id: 'tax-liability', icon: 'file-text', name: t('finances.taxLiabilityReport'), description: t('finances.taxLiabilityReportDesc'), color: '#d32f2f' },
    { id: 'ar-aging', icon: 'clock', name: t('finances.accountsReceivableAging'), description: t('finances.accountsReceivableAgingDesc'), color: '#00897b' },
    { id: 'ap-aging', icon: 'timer', name: t('finances.accountsPayableAging'), description: t('finances.accountsPayableAgingDesc'), color: '#8d6e63' },
    { id: 'refund', icon: 'rotate-ccw', name: t('finances.refundAnalysis'), description: t('finances.refundAnalysisDesc'), color: '#e53935' },
  ];
}

export async function renderFinancesReports() {
  const t = languageManager.t.bind(languageManager);
  const profile = authManager.getUserProfile();
  const role = profile?.role || 'buyer';
  const reportCards = getReportCards(t);

  const content = `
    <div class="invoices-page">
      <div class="page-header">
        <h1><i data-lucide="bar-chart-2"></i> ${escapeHtml(t('finances.reportsCenter'))}</h1>
        <p>${escapeHtml(t('finances.generateAndViewReports'))}</p>
      </div>

      <div class="stats-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
        ${reportCards.map(card => `
          <div class="stat-card" style="cursor: pointer; padding: 24px;" data-report="${card.id}">
            <div class="stat-icon" style="background-color: ${card.color}20;">
              <i data-lucide="${card.icon}" style="color: ${card.color};"></i>
            </div>
            <div class="stat-content">
              <h3 style="margin-bottom: 4px;">${escapeHtml(card.name)}</h3>
              <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 12px;">${escapeHtml(card.description)}</p>
              <div style="display: flex; gap: 8px; align-items: center;">
                <button class="btn btn-primary btn-sm">${escapeHtml(t('finances.runReport'))}</button>
                <span style="font-size: 11px; color: var(--text-secondary);">${escapeHtml(t('finances.lastNever'))}</span>
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
      const reportName = reportCards.find(r => r.id === reportId)?.name || 'Report';
      window.toast.info(`${reportName} — ${t('finances.reportComingSoon')}`);
    });
  });
}
