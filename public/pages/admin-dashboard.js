import { renderPageWithLayout } from '../js/layout.js';

export function renderAdminDashboard() {
  const content = `
    <div class="dashboard-page">
      <div class="page-header">
        <h1>Admin Dashboard</h1>
        <p>Manage the platform</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e3f2fd;">
            <i data-lucide="users" style="color: #1976d2;"></i>
          </div>
          <div class="stat-content">
            <h3>Total Users</h3>
            <p class="stat-value">1,234</p>
            <span class="stat-label">Active accounts</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #fff3e0;">
            <i data-lucide="shopping-bag" style="color: #f57c00;"></i>
          </div>
          <div class="stat-content">
            <h3>Total Orders</h3>
            <p class="stat-value">5,678</p>
            <span class="stat-label">All time</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e8f5e9;">
            <i data-lucide="dollar-sign" style="color: #388e3c;"></i>
          </div>
          <div class="stat-content">
            <h3>Revenue</h3>
            <p class="stat-value">$1.2M</p>
            <span class="stat-label">Total platform revenue</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #f3e5f5;">
            <i data-lucide="store" style="color: #7b1fa2;"></i>
          </div>
          <div class="stat-content">
            <h3>Sellers</h3>
            <p class="stat-value">234</p>
            <span class="stat-label">Active sellers</span>
          </div>
        </div>
      </div>

      <div class="dashboard-section">
        <h2>Platform Overview</h2>
        <p>Admin controls and analytics will be displayed here</p>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'admin');
  if (window.lucide) window.lucide.createIcons();
}
