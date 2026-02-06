import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import authManager from '../js/auth.js';
import { escapeHtml } from '../js/utils.js';
import languageManager from '../js/language.js';
import dataService from '../js/dataService.js';

function getStatusColor(status) {
  const statusLower = status?.toLowerCase() || '';
  switch (statusLower) {
    case 'delivered':
      return 'status-delivered';
    case 'in transit':
    case 'shipped':
      return 'status-transit';
    case 'processing':
      return 'status-processing';
    default:
      return 'status-pending';
  }
}

export async function renderBuyerDashboard() {
  const profile = authManager.getUserProfile();
  const t = languageManager.t.bind(languageManager);
  const userId = authManager.getCurrentUser()?.uid;
  
  // Show loading state
  const content = `
    <div class="dashboard-page">
      <div class="dashboard-header">
        <div>
          <h1>${t('dashboard.welcome')}, ${escapeHtml(profile?.displayName || 'User')}!</h1>
          <p class="dashboard-subtitle">${t('dashboard.buyerSubtitle')}</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e3f2fd;">
            <i data-lucide="package" style="color: #1976d2;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('dashboard.totalOrders')}</h3>
            <p class="stat-value" id="total-orders-stat">${t('common.loading')}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #fff3e0;">
            <i data-lucide="clock" style="color: #f57c00;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('dashboard.activeOrders')}</h3>
            <p class="stat-value" id="active-orders-stat">${t('common.loading')}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e8f5e9;">
            <i data-lucide="dollar-sign" style="color: #388e3c;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('dashboard.totalSpent')}</h3>
            <p class="stat-value" id="total-spent-stat">${t('common.loading')}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #f3e5f5;">
            <i data-lucide="check-circle" style="color: #7b1fa2;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('dashboard.completedOrders')}</h3>
            <p class="stat-value" id="completed-orders-stat">${t('common.loading')}</p>
          </div>
        </div>
      </div>

      <!-- Recent Orders Section -->
      <div class="dashboard-section">
        <div class="section-header">
          <h2>${t('dashboard.recentOrders')}</h2>
          <button class="btn btn-text" data-nav="/buyer/orders">${t('dashboard.viewAll')}</button>
        </div>

        <div id="recent-orders-container">
          <p style="text-align: center; color: var(--text-secondary);">${t('common.loading')}</p>
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

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Load real data
  try {
    // Fetch dashboard stats
    const stats = await dataService.getDashboardStats('buyer');
    document.getElementById('total-orders-stat').textContent = stats.totalOrders || 0;
    document.getElementById('active-orders-stat').textContent = stats.activeOrders || 0;
    document.getElementById('total-spent-stat').textContent = `$${(stats.totalSpent || 0).toLocaleString()}`;
    document.getElementById('completed-orders-stat').textContent = stats.completedOrders || 0;

    // Fetch recent orders
    const recentOrders = await dataService.getRecentOrders(userId, 5);
    const ordersContainer = document.getElementById('recent-orders-container');
    
    if (recentOrders.length === 0) {
      ordersContainer.innerHTML = `
        <div class="empty-state">
          <i data-lucide="package" style="width: 48px; height: 48px; opacity: 0.3;"></i>
          <p>${t('orders.noOrders')}</p>
        </div>
      `;
    } else {
      ordersContainer.innerHTML = `
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
              ${recentOrders.map(order => `
                <tr>
                  <td class="font-medium">${escapeHtml(order.id || order.orderNumber || '')}</td>
                  <td>${escapeHtml(order.date || new Date(order.createdAt?.toDate?.() || Date.now()).toLocaleDateString())}</td>
                  <td>${escapeHtml(order.product || order.productName || '')}</td>
                  <td>${escapeHtml(order.quantity || '')}</td>
                  <td>${escapeHtml(order.seller || order.sellerName || '')}</td>
                  <td class="font-medium">$${(order.total || 0).toLocaleString()}</td>
                  <td>
                    <span class="status-badge ${getStatusColor(order.status)}">
                      ${escapeHtml(order.status || 'Pending')}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // Re-initialize Lucide icons for newly added elements
    if (window.lucide) {
      window.lucide.createIcons();
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    // Keep the loading indicators or show error message
    document.querySelectorAll('[id$="-stat"]').forEach(el => {
      el.textContent = '0';
    });
    document.getElementById('recent-orders-container').innerHTML = `
      <p style="text-align: center; color: var(--error);">${t('common.error')}</p>
    `;
  }

  // Add event listeners for navigation
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const path = btn.getAttribute('data-nav');
      router.navigate(path);
    });
  });
}
