import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import authManager from '../js/auth.js';
import { escapeHtml } from '../js/utils.js';
import languageManager from '../js/language.js';

const mockStats = {
  totalOrders: 24,
  activeOrders: 5,
  totalSpent: 125000,
  completedOrders: 19
};

const mockRecentOrders = [
  {
    id: 'ORD-001',
    date: '2024-01-15',
    product: 'Aluminum Sheet 6061-T6',
    quantity: '500 kg',
    total: 12500,
    status: 'Delivered',
    seller: 'I ONE Construction'
  },
  {
    id: 'ORD-002',
    date: '2024-01-14',
    product: 'Aluminum Extrusion Profile',
    quantity: '1000 units',
    total: 25000,
    status: 'In Transit',
    seller: 'Metro Aluminum Co.'
  },
  {
    id: 'ORD-003',
    date: '2024-01-12',
    product: 'Aluminum Rod 2024-T4',
    quantity: '300 kg',
    total: 8500,
    status: 'Processing',
    seller: 'Premium Metals Ltd.'
  },
  {
    id: 'ORD-004',
    date: '2024-01-10',
    product: 'Aluminum Plate 7075',
    quantity: '200 kg',
    total: 15000,
    status: 'Delivered',
    seller: 'I ONE Construction'
  }
];

function getStatusColor(status) {
  switch (status) {
    case 'Delivered':
      return 'status-delivered';
    case 'In Transit':
      return 'status-transit';
    case 'Processing':
      return 'status-processing';
    default:
      return 'status-pending';
  }
}

export function renderBuyerDashboard() {
  const profile = authManager.getUserProfile();
  const t = languageManager.t.bind(languageManager);
  
  const content = `
    <div class="dashboard-page">
      <div class="dashboard-header">
        <div>
          <h1>${t('dashboard.welcome')}, ${escapeHtml(profile?.displayName || 'User')}!</h1>
          <p class="dashboard-subtitle">${t('dashboard.buyerSubtitle')}</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e3f2fd;">
            <i data-lucide="package" style="color: #1976d2;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('dashboard.totalOrders')}</h3>
            <p class="stat-value">${mockStats.totalOrders}</p>
            <span class="stat-change positive">
              <i data-lucide="trending-up" style="width: 16px; height: 16px;"></i>
              +12% ${t('dashboard.fromLastMonth')}
            </span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #fff3e0;">
            <i data-lucide="clock" style="color: #f57c00;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('dashboard.activeOrders')}</h3>
            <p class="stat-value">${mockStats.activeOrders}</p>
            <span class="stat-label">${t('dashboard.currentlyInProgress')}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e8f5e9;">
            <i data-lucide="dollar-sign" style="color: #388e3c;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('dashboard.totalSpent')}</h3>
            <p class="stat-value">$${mockStats.totalSpent.toLocaleString()}</p>
            <span class="stat-change positive">
              <i data-lucide="trending-up" style="width: 16px; height: 16px;"></i>
              +8% ${t('dashboard.fromLastMonth')}
            </span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #f3e5f5;">
            <i data-lucide="check-circle" style="color: #7b1fa2;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('dashboard.completedOrders')}</h3>
            <p class="stat-value">${mockStats.completedOrders}</p>
            <span class="stat-label">${t('dashboard.successfullyDelivered')}</span>
          </div>
        </div>
      </div>

      <!-- Recent Orders Section -->
      <div class="dashboard-section">
        <div class="section-header">
          <h2>${t('dashboard.recentOrders')}</h2>
          <button class="btn btn-text" data-nav="/buyer/orders">${t('dashboard.viewAll')}</button>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>${t('orders.orderId')}</th>
                <th>${t('orders.date')}</th>
                <th>${t('orders.product')}</th>
                <th>${t('orders.quantity')}</th>
                <th>${t('orders.seller')}</th>
                <th>${t('orders.total')}</th>
                <th>${t('orders.status')}</th>
              </tr>
            </thead>
            <tbody>
              ${mockRecentOrders.map(order => `
                <tr>
                  <td class="font-medium">${escapeHtml(order.id)}</td>
                  <td>${escapeHtml(order.date)}</td>
                  <td>${escapeHtml(order.product)}</td>
                  <td>${escapeHtml(order.quantity)}</td>
                  <td>${escapeHtml(order.seller)}</td>
                  <td class="font-medium">$${order.total.toLocaleString()}</td>
                  <td>
                    <span class="status-badge ${getStatusColor(order.status)}">
                      ${escapeHtml(order.status)}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>${t('dashboard.quickActions')}</h2>
        <div class="action-buttons">
          <button class="action-button" data-nav="/buyer/catalog">
            <i data-lucide="shopping-cart"></i>
            ${t('dashboard.browseCatalog')}
          </button>
          <button class="action-button" data-nav="/buyer/orders">
            <i data-lucide="package"></i>
            ${t('dashboard.viewOrders')}
          </button>
          <button class="action-button" data-nav="/buyer/sellers">
            <i data-lucide="store"></i>
            ${t('dashboard.findSellers')}
          </button>
        </div>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');

  // Add event listeners for navigation
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const path = btn.getAttribute('data-nav');
      router.navigate(path);
    });
  });

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
