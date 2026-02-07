import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import authManager from '../js/auth.js';
import { escapeHtml } from '../js/utils.js';
import languageManager from '../js/language.js';
import dataService from '../js/dataService.js';

function getStockStatus(stock) {
  if (stock > 400) return { label: 'In Stock', className: 'status-delivered' };
  if (stock > 200) return { label: 'Low Stock', className: 'status-transit' };
  return { label: 'Very Low', className: 'status-pending' };
}

export async function renderSellerDashboard() {
  const profile = authManager.getUserProfile();
  const t = languageManager.t.bind(languageManager);
  
  // Fetch real stats and products from Firebase
  const stats = await dataService.getDashboardStats('seller');
  const topProducts = await dataService.getTopProducts(authManager.getCurrentUser()?.uid, 4);
  
  const content = `
    <div class="dashboard-page">
      <div class="dashboard-header">
        <div>
          <h1>${t('dashboard.welcome')}, ${escapeHtml(profile?.displayName || 'User')}!</h1>
          <p class="dashboard-subtitle">${t('dashboard.sellerSubtitle')}</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e3f2fd;">
            <i data-lucide="package" style="color: #1976d2;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('dashboard.totalProducts')}</h3>
            <p class="stat-value">${stats.totalProducts || 0}</p>
            <span class="stat-label">${t('dashboard.activeListings')}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #fff3e0;">
            <i data-lucide="shopping-bag" style="color: #f57c00;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('dashboard.totalOrders')}</h3>
            <p class="stat-value">${stats.totalOrders || 0}</p>
            <span class="stat-label">${t('dashboard.allTimeOrders')}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e8f5e9;">
            <i data-lucide="dollar-sign" style="color: #388e3c;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('dashboard.revenue')}</h3>
            <p class="stat-value">$${(stats.revenue || 0).toLocaleString()}</p>
            <span class="stat-label">${t('dashboard.totalRevenue')}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #f3e5f5;">
            <i data-lucide="alert-circle" style="color: #7b1fa2;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('dashboard.activeOrders')}</h3>
            <p class="stat-value">${stats.activeOrders || 0}</p>
            <span class="stat-label">${t('dashboard.needsAttention')}</span>
          </div>
        </div>
      </div>

      <!-- Top Products Section -->
      <div class="dashboard-section">
        <div class="section-header">
          <h2>${t('dashboard.topProducts')}</h2>
          <button class="btn btn-text" data-nav="/seller/products">${t('dashboard.viewAll')}</button>
        </div>

        <div class="table-container">
          ${topProducts.length === 0 ? `
            <div class="empty-state">
              <i data-lucide="package-open" style="width: 64px; height: 64px; opacity: 0.3; margin-bottom: 16px;"></i>
              <p>No products yet. Start by adding products to your inventory.</p>
              <button class="btn btn-primary" data-nav="/seller/products" style="margin-top: 16px;">
                <i data-lucide="plus"></i>
                Add Products
              </button>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Sales</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${topProducts.map(product => {
                  const stockStatus = getStockStatus(product.stock || 0);
                  return `
                    <tr>
                      <td class="font-medium">${escapeHtml(product.id?.substring(0, 8) || 'N/A')}</td>
                      <td>${escapeHtml(product.modelNumber || product.name || 'N/A')}</td>
                      <td>${escapeHtml(product.category || 'N/A')}</td>
                      <td>${product.stock || 0} ${escapeHtml(product.unit || 'units')}</td>
                      <td class="font-medium">$${product.pricePerMeter || product.price || 0}/${escapeHtml(product.unit || 'unit')}</td>
                      <td>${product.sales || 0} units</td>
                      <td>
                        <span class="status-badge ${stockStatus.className}">
                          ${escapeHtml(stockStatus.label)}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>${t('dashboard.quickActions')}</h2>
        <div class="action-buttons">
          <button class="action-button" data-nav="/seller/products">
            <i data-lucide="package"></i>
            ${t('dashboard.manageProducts')}
          </button>
          <button class="action-button" data-nav="/seller/orders">
            <i data-lucide="shopping-bag"></i>
            ${t('dashboard.viewOrders')}
          </button>
          <button class="action-button" data-nav="/seller/branches">
            <i data-lucide="git-branch"></i>
            ${t('dashboard.manageBranches')}
          </button>
        </div>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'seller');

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
