import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import authManager from '../js/auth.js';
import { escapeHtml, formatCurrency, formatDate } from '../js/utils.js';
import languageManager from '../js/language.js';
import dataService from '../js/dataService.js';

function getStatusClass(status) {
  const map = {
    completed: 'status-delivered',
    paid: 'status-delivered',
    pending: 'status-pending',
    processing: 'status-transit',
    cancelled: 'status-pending',
  };
  return map[status?.toLowerCase()] || 'status-pending';
}

async function fetchFinancialData() {
  await dataService.init();
  const uid = authManager.getCurrentUser()?.uid;
  const profile = authManager.getUserProfile();
  const role = profile?.role || 'buyer';
  let orders = [];
  let invoices = [];

  try {
    if (dataService.db) {
      let ordersQuery = dataService.db.collection('orders');
      let invoicesQuery = dataService.db.collection('invoices');

      // Scope data by role: sellers see their sales, buyers see their purchases, admin sees all
      if (role === 'seller') {
        ordersQuery = ordersQuery.where('sellerId', '==', uid);
        invoicesQuery = invoicesQuery.where('sellerId', '==', uid);
      } else if (role === 'buyer') {
        ordersQuery = ordersQuery.where('buyerId', '==', uid);
        invoicesQuery = invoicesQuery.where('buyerId', '==', uid);
      }

      const ordersSnap = await ordersQuery.orderBy('createdAt', 'desc').limit(50).get();
      orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const invoicesSnap = await invoicesQuery.orderBy('createdAt', 'desc').limit(50).get();
      invoices = invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  } catch (err) {
    console.error('Error fetching financial data:', err);
  }

  const grossRevenue = invoices.reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0);
  const taxCollected = invoices.reduce((sum, inv) => sum + (inv.tax || 0), 0);
  const expenses = orders.reduce((sum, o) => sum + (o.shippingCost || 0), 0);
  const netProfit = grossRevenue - expenses - taxCollected;

  return { grossRevenue, netProfit, expenses, taxCollected, orders, invoices };
}

function buildTransactionsRows(orders, t) {
  const recent = orders.slice(0, 10);
  if (recent.length === 0) {
    return `<tr><td colspan="5" style="text-align:center;padding:24px;opacity:0.6;">${t('finances.noRecentTransactions')}</td></tr>`;
  }
  return recent.map(order => {
    const date = formatDate(order.createdAt);
    const ref = escapeHtml(order.id?.substring(0, 8) || 'N/A');
    const desc = escapeHtml(order.productName || order.description || t('finances.order'));
    const amount = formatCurrency(order.total || order.amount || 0);
    const status = escapeHtml(order.status || 'pending');
    const statusClass = getStatusClass(order.status);
    return `
      <tr>
        <td>${date}</td>
        <td class="font-medium">${ref}</td>
        <td>${desc}</td>
        <td class="font-medium">${amount}</td>
        <td><span class="status-badge ${statusClass}">${status}</span></td>
      </tr>`;
  }).join('');
}

function buildChartPlaceholder(grossRevenue, expenses, t) {
  const max = Math.max(grossRevenue, expenses, 1);
  const revPct = Math.round((grossRevenue / max) * 100);
  const expPct = Math.round((expenses / max) * 100);
  return `
    <div style="display:flex;align-items:flex-end;gap:32px;height:120px;padding:16px 0;">
      <div style="display:flex;flex-direction:column;align-items:center;flex:1;">
        <div style="width:100%;background:#388e3c;border-radius:4px 4px 0 0;height:${revPct}%;min-height:4px;"></div>
        <span style="margin-top:8px;font-size:12px;">${t('finances.revenue')}</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;flex:1;">
        <div style="width:100%;background:#d32f2f;border-radius:4px 4px 0 0;height:${expPct}%;min-height:4px;"></div>
        <span style="margin-top:8px;font-size:12px;">${t('finances.expenses')}</span>
      </div>
    </div>`;
}

export async function renderFinancesDashboard() {
  const profile = authManager.getUserProfile();
  const role = profile?.role || 'buyer';
  const t = languageManager.t.bind(languageManager);
  const data = await fetchFinancialData();

  const basePath = `/${role}/finances`;

  const content = `
    <div class="dashboard-page">
      <div class="dashboard-header">
        <div>
          <h1>${t('finances.dashboard')}</h1>
          <p class="dashboard-subtitle">${t('finances.dashboardSubtitle')}</p>
        </div>
      </div>

      <!-- Sub-navigation -->
      <div style="display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap;border-bottom:1px solid var(--border-color);padding-bottom:16px;">
        <a href="#" class="btn btn-primary" data-nav="${basePath}">${t('finances.dashboardNav')}</a>
        <a href="#" class="btn" data-nav="${basePath}/transactions">${t('finances.transactions')}</a>
        <a href="#" class="btn" data-nav="${basePath}/accounts">${t('finances.chartOfAccounts')}</a>
        <a href="#" class="btn" data-nav="${basePath}/reports">${t('finances.reports')}</a>
        <a href="#" class="btn" data-nav="${basePath}/tax">${t('finances.taxManagement')}</a>
        <a href="#" class="btn" data-nav="${basePath}/reconciliation">${t('finances.reconciliation')}</a>
      </div>

      <!-- Period Selector -->
      <div style="display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap;">
        <button class="btn btn-primary period-btn" data-period="today">${t('finances.today')}</button>
        <button class="btn period-btn" data-period="week">${t('finances.thisWeek')}</button>
        <button class="btn period-btn" data-period="month">${t('finances.thisMonth')}</button>
        <button class="btn period-btn" data-period="quarter">${t('finances.thisQuarter')}</button>
        <button class="btn period-btn" data-period="year">${t('finances.thisYear')}</button>
      </div>

      <!-- Summary Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e8f5e9;">
            <i data-lucide="trending-up" style="color: #388e3c;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('finances.grossRevenue')}</h3>
            <p class="stat-value">${formatCurrency(data.grossRevenue)}</p>
            <span class="stat-label">${t('finances.fromPreviousPeriod')}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e3f2fd;">
            <i data-lucide="dollar-sign" style="color: #1976d2;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('finances.netProfit')}</h3>
            <p class="stat-value">${formatCurrency(data.netProfit)}</p>
            <span class="stat-label">${t('finances.fromPreviousPeriod')}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #fff3e0;">
            <i data-lucide="credit-card" style="color: #f57c00;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('finances.expenses')}</h3>
            <p class="stat-value">${formatCurrency(data.expenses)}</p>
            <span class="stat-label">${t('finances.fromPreviousPeriod')}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #f3e5f5;">
            <i data-lucide="receipt" style="color: #7b1fa2;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('finances.taxCollected')}</h3>
            <p class="stat-value">${formatCurrency(data.taxCollected)}</p>
            <span class="stat-label">${t('finances.fromPreviousPeriod')}</span>
          </div>
        </div>
      </div>

      <!-- Revenue vs Expenses Chart -->
      <div class="dashboard-section">
        <div class="section-header">
          <h2>${t('finances.revenueVsExpenses')}</h2>
        </div>
        <div class="stat-card" style="padding:24px;">
          ${buildChartPlaceholder(data.grossRevenue, data.expenses, t)}
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="dashboard-section">
        <div class="section-header">
          <h2>${t('finances.recentTransactions')}</h2>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>${t('finances.date')}</th>
                <th>${t('finances.reference')}</th>
                <th>${t('finances.description')}</th>
                <th>${t('finances.amount')}</th>
                <th>${t('finances.status')}</th>
              </tr>
            </thead>
            <tbody>
              ${buildTransactionsRows(data.orders, t)}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>${t('finances.quickActions')}</h2>
        <div class="action-buttons">
          <button class="action-button" id="btn-reconcile">
            <i data-lucide="check-circle"></i>
            ${t('finances.reconcileNow')}
          </button>
          <button class="action-button" id="btn-reports">
            <i data-lucide="bar-chart-2"></i>
            ${t('finances.generateReports')}
          </button>
          <button class="action-button" id="btn-export">
            <i data-lucide="download"></i>
            ${t('finances.exportStatements')}
          </button>
          <button class="action-button" id="btn-tax">
            <i data-lucide="file-text"></i>
            ${t('finances.taxFiling')}
          </button>
        </div>
      </div>
    </div>
  `;

  renderPageWithLayout(content, role);

  // Navigation listeners
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      router.navigate(btn.getAttribute('data-nav'));
    });
  });

  // Period selector (visual toggle; data filtering is a future enhancement)
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('btn-primary'));
      btn.classList.add('btn-primary');
    });
  });

  // Quick action buttons
  document.getElementById('btn-reconcile')?.addEventListener('click', () => router.navigate(`${basePath}/reconciliation`));
  document.getElementById('btn-reports')?.addEventListener('click', () => router.navigate(`${basePath}/reports`));
  document.getElementById('btn-export')?.addEventListener('click', () => {
    window.toast.info(t('finances.exportStatementsComingSoon'));
  });
  document.getElementById('btn-tax')?.addEventListener('click', () => router.navigate(`${basePath}/tax`));

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
