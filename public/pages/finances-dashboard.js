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
  let orders = [];
  let invoices = [];

  try {
    if (dataService.db) {
      const ordersSnap = await dataService.db.collection('orders')
        .orderBy('createdAt', 'desc').limit(50).get();
      orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const invoicesSnap = await dataService.db.collection('invoices')
        .orderBy('createdAt', 'desc').limit(50).get();
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

function buildTransactionsRows(orders) {
  const recent = orders.slice(0, 10);
  if (recent.length === 0) {
    return `<tr><td colspan="5" style="text-align:center;padding:24px;opacity:0.6;">No recent transactions found.</td></tr>`;
  }
  return recent.map(order => {
    const date = formatDate(order.createdAt);
    const ref = escapeHtml(order.id?.substring(0, 8) || 'N/A');
    const desc = escapeHtml(order.productName || order.description || 'Order');
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

function buildChartPlaceholder(grossRevenue, expenses) {
  const max = Math.max(grossRevenue, expenses, 1);
  const revPct = Math.round((grossRevenue / max) * 100);
  const expPct = Math.round((expenses / max) * 100);
  return `
    <div style="display:flex;align-items:flex-end;gap:32px;height:120px;padding:16px 0;">
      <div style="display:flex;flex-direction:column;align-items:center;flex:1;">
        <div style="width:100%;background:#388e3c;border-radius:4px 4px 0 0;height:${revPct}%;min-height:4px;"></div>
        <span style="margin-top:8px;font-size:12px;">Revenue</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;flex:1;">
        <div style="width:100%;background:#d32f2f;border-radius:4px 4px 0 0;height:${expPct}%;min-height:4px;"></div>
        <span style="margin-top:8px;font-size:12px;">Expenses</span>
      </div>
    </div>`;
}

export async function renderFinancesDashboard() {
  const profile = authManager.getUserProfile();
  const t = languageManager.t.bind(languageManager);
  const data = await fetchFinancialData();

  const content = `
    <div class="dashboard-page">
      <div class="dashboard-header">
        <div>
          <h1>Financial Dashboard</h1>
          <p class="dashboard-subtitle">Overview of revenue, expenses, and recent transactions</p>
        </div>
      </div>

      <!-- Period Selector -->
      <div style="display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap;">
        <button class="btn btn-primary period-btn" data-period="today">Today</button>
        <button class="btn period-btn" data-period="week">This Week</button>
        <button class="btn period-btn" data-period="month">This Month</button>
        <button class="btn period-btn" data-period="quarter">This Quarter</button>
        <button class="btn period-btn" data-period="year">This Year</button>
      </div>

      <!-- Summary Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e8f5e9;">
            <i data-lucide="trending-up" style="color: #388e3c;"></i>
          </div>
          <div class="stat-content">
            <h3>Gross Revenue</h3>
            <p class="stat-value">${formatCurrency(data.grossRevenue)}</p>
            <span class="stat-label">+0% from previous period</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e3f2fd;">
            <i data-lucide="dollar-sign" style="color: #1976d2;"></i>
          </div>
          <div class="stat-content">
            <h3>Net Profit</h3>
            <p class="stat-value">${formatCurrency(data.netProfit)}</p>
            <span class="stat-label">+0% from previous period</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #fff3e0;">
            <i data-lucide="credit-card" style="color: #f57c00;"></i>
          </div>
          <div class="stat-content">
            <h3>Expenses</h3>
            <p class="stat-value">${formatCurrency(data.expenses)}</p>
            <span class="stat-label">+0% from previous period</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #f3e5f5;">
            <i data-lucide="receipt" style="color: #7b1fa2;"></i>
          </div>
          <div class="stat-content">
            <h3>Tax Collected</h3>
            <p class="stat-value">${formatCurrency(data.taxCollected)}</p>
            <span class="stat-label">+0% from previous period</span>
          </div>
        </div>
      </div>

      <!-- Revenue vs Expenses Chart -->
      <div class="dashboard-section">
        <div class="section-header">
          <h2>Revenue vs Expenses — Last 30 Days</h2>
        </div>
        <div class="stat-card" style="padding:24px;">
          ${buildChartPlaceholder(data.grossRevenue, data.expenses)}
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="dashboard-section">
        <div class="section-header">
          <h2>Recent Transactions</h2>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${buildTransactionsRows(data.orders)}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="action-buttons">
          <button class="action-button" id="btn-reconcile">
            <i data-lucide="check-circle"></i>
            Reconcile Now
          </button>
          <button class="action-button" id="btn-reports">
            <i data-lucide="bar-chart-2"></i>
            Generate Reports
          </button>
          <button class="action-button" id="btn-export">
            <i data-lucide="download"></i>
            Export Statements
          </button>
          <button class="action-button" id="btn-tax">
            <i data-lucide="file-text"></i>
            Tax Filing
          </button>
        </div>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'seller');

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

  // Quick action placeholders
  ['btn-reconcile', 'btn-reports', 'btn-export', 'btn-tax'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => alert('This feature is coming soon.'));
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
