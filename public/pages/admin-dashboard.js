import { renderPageWithLayout } from '../js/layout.js';
import languageManager from '../js/language.js';
import dataService from '../js/dataService.js';

export async function renderAdminDashboard() {
  const t = languageManager.t.bind(languageManager);
  
  const content = `
    <div class="dashboard-page">
      <div class="page-header">
        <h1>${t('nav.dashboard')}</h1>
        <p>${t('dashboard.adminSubtitle')}</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e3f2fd;">
            <i data-lucide="users" style="color: #1976d2;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('dashboard.totalUsers')}</h3>
            <p class="stat-value" id="admin-total-users-stat">${t('common.loading')}</p>
            <span class="stat-label">${t('dashboard.activeAccounts')}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #fff3e0;">
            <i data-lucide="shopping-bag" style="color: #f57c00;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('dashboard.totalOrders')}</h3>
            <p class="stat-value" id="admin-total-orders-stat">${t('common.loading')}</p>
            <span class="stat-label">${t('dashboard.allTime')}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e8f5e9;">
            <i data-lucide="dollar-sign" style="color: #388e3c;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('dashboard.revenue')}</h3>
            <p class="stat-value" id="admin-revenue-stat">${t('common.loading')}</p>
            <span class="stat-label">${t('dashboard.totalPlatformRevenue')}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #f3e5f5;">
            <i data-lucide="store" style="color: #7b1fa2;"></i>
          </div>
          <div class="stat-content">
            <h3>${t('dashboard.sellers')}</h3>
            <p class="stat-value" id="admin-active-sellers-stat">${t('common.loading')}</p>
            <span class="stat-label">${t('dashboard.activeSellers')}</span>
          </div>
        </div>
      </div>

      <div class="dashboard-section">
        <h2>${t('dashboard.platformOverview')}</h2>
        <p>${t('dashboard.adminControlsMessage')}</p>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'admin');
  if (window.lucide) window.lucide.createIcons();

  // Load real data from Firestore
  try {
    const stats = await dataService.getDashboardStats('admin');
    document.getElementById('admin-total-users-stat').textContent = (stats.totalUsers || 0).toLocaleString();
    document.getElementById('admin-total-orders-stat').textContent = (stats.totalOrders || 0).toLocaleString();
    document.getElementById('admin-revenue-stat').textContent = `$${(stats.revenue || 0).toLocaleString()}`;
    document.getElementById('admin-active-sellers-stat').textContent = (stats.activeSellers || 0).toLocaleString();
  } catch (error) {
    console.error('Error loading admin dashboard data:', error);
    document.querySelectorAll('[id^="admin-"][id$="-stat"]').forEach(el => {
      el.textContent = t('common.error');
    });
  }
}
