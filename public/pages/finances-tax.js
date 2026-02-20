import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import languageManager from '../js/language.js';
import { escapeHtml, formatCurrency } from '../js/utils.js';

const DEFAULT_TAX_RATES = [
  { jurisdiction: 'United States', region: 'Federal', rate: 0, type: 'Sales Tax', shipping: false },
  { jurisdiction: 'China', region: 'National', rate: 13, type: 'VAT', shipping: true },
  { jurisdiction: 'United Arab Emirates', region: 'National', rate: 5, type: 'VAT', shipping: true },
  { jurisdiction: 'European Union', region: 'Standard', rate: 20, type: 'VAT', shipping: true },
  { jurisdiction: 'Saudi Arabia', region: 'National', rate: 15, type: 'VAT', shipping: true },
  { jurisdiction: 'Pakistan', region: 'National', rate: 18, type: 'GST', shipping: false },
];

export async function renderFinancesTax() {
  const t = languageManager.t.bind(languageManager);
  const profile = authManager.getUserProfile();
  const role = profile?.role || 'buyer';

  const content = `
    <div class="invoices-page">
      <div class="page-header">
        <div>
          <h1><i data-lucide="landmark"></i> ${t('finances.taxManagement')}</h1>
          <p>${t('finances.manageTaxRates')}</p>
        </div>
        <button class="btn btn-primary" id="add-tax-rate-btn"><i data-lucide="plus"></i> ${t('finances.addTaxRate')}</button>
      </div>

      <!-- Tax Liability Summary -->
      <div class="stats-grid" style="margin-bottom: 24px;">
        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e8f5e9;">
            <i data-lucide="dollar-sign" style="color: #388e3c;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('finances.collectedThisMonth')}</h3>
            <p class="stat-value">$0.00</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background-color: #fff3e0;">
            <i data-lucide="alert-triangle" style="color: #f57c00;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('finances.dueThisQuarter')}</h3>
            <p class="stat-value">$0.00</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e3f2fd;">
            <i data-lucide="check-circle" style="color: #1976d2;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('finances.paid')}</h3>
            <p class="stat-value">$0.00</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background-color: #ffebee;">
            <i data-lucide="clock" style="color: #d32f2f;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('finances.outstanding')}</h3>
            <p class="stat-value">$0.00</p>
          </div>
        </div>
      </div>

      <!-- Tax Rates Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>${t('finances.jurisdiction')}</th>
              <th>${t('finances.region')}</th>
              <th>${t('finances.rate')}</th>
              <th>${t('finances.type')}</th>
              <th>${t('finances.applyToShipping')}</th>
              <th>${t('finances.actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${DEFAULT_TAX_RATES.map(tax => `
              <tr>
                <td class="font-medium">${escapeHtml(tax.jurisdiction)}</td>
                <td>${escapeHtml(tax.region)}</td>
                <td>${tax.rate}%</td>
                <td><span class="badge badge-seller">${escapeHtml(tax.type)}</span></td>
                <td>${tax.shipping ? `<span style="color:#388e3c;">${t('finances.yes')}</span>` : `<span style="color:#999;">${t('finances.no')}</span>`}</td>
                <td class="actions">
                  <button class="btn-icon" title="${t('finances.edit')}"><i data-lucide="edit"></i></button>
                  <button class="btn-icon btn-danger" title="${t('finances.delete')}"><i data-lucide="trash-2"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Tax Report Generation -->
      <div style="margin-top: 32px; padding: 24px; background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border-color);">
        <h2 style="margin: 0 0 12px;"><i data-lucide="file-text" style="width:20px;height:20px;vertical-align:middle;"></i> ${t('finances.generateTaxReport')}</h2>
        <p style="color: var(--text-secondary); margin: 0 0 16px;">${t('finances.generateTaxReportDesc')}</p>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <select class="form-control" style="max-width: 200px;">
            <option value="">${t('finances.selectJurisdiction')}</option>
            ${DEFAULT_TAX_RATES.map(rate => `<option>${escapeHtml(rate.jurisdiction)}</option>`).join('')}
          </select>
          <input type="date" class="form-control" style="max-width: 160px;" />
          <input type="date" class="form-control" style="max-width: 160px;" />
          <button class="btn btn-primary" id="generate-tax-report-btn">${t('finances.generateReport')}</button>
        </div>
      </div>
    </div>
  `;

  renderPageWithLayout(content, role);
  if (window.lucide) window.lucide.createIcons();

  document.getElementById('add-tax-rate-btn')?.addEventListener('click', () => {
    window.toast.info(t('finances.addTaxRateComingSoon'));
  });
  document.getElementById('generate-tax-report-btn')?.addEventListener('click', () => {
    window.toast.info(t('finances.taxReportComingSoon'));
  });
}
