import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import authManager from '../js/auth.js';

const mockStats = {
  totalProducts: 48,
  totalOrders: 156,
  revenue: 485000,
  activeOrders: 12
};

const mockProducts = [
  {
    id: 'PROD-001',
    name: 'Aluminum Sheet 6061-T6',
    category: 'Sheets',
    stock: 500,
    price: 25,
    unit: 'kg',
    sales: 1200
  },
  {
    id: 'PROD-002',
    name: 'Aluminum Extrusion Profile',
    category: 'Extrusions',
    stock: 800,
    price: 35,
    unit: 'unit',
    sales: 950
  },
  {
    id: 'PROD-003',
    name: 'Aluminum Rod 2024-T4',
    category: 'Rods',
    stock: 250,
    price: 45,
    unit: 'kg',
    sales: 680
  },
  {
    id: 'PROD-004',
    name: 'Aluminum Plate 7075',
    category: 'Plates',
    stock: 150,
    price: 55,
    unit: 'kg',
    sales: 520
  }
];

function getStockStatus(stock) {
  if (stock > 400) return { label: 'In Stock', className: 'status-delivered' };
  if (stock > 200) return { label: 'Low Stock', className: 'status-transit' };
  return { label: 'Very Low', className: 'status-pending' };
}

export function renderSellerDashboard() {
  const profile = authManager.getUserProfile();
  
  const content = `
    <div class="dashboard-page">
      <div class="dashboard-header">
        <div>
          <h1>Welcome back, ${profile?.displayName || 'User'}!</h1>
          <p class="dashboard-subtitle">Here's an overview of your business performance</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e3f2fd;">
            <i data-lucide="package" style="color: #1976d2;"></i>
          </div>
          <div class="stat-content">
            <h3>Total Products</h3>
            <p class="stat-value">${mockStats.totalProducts}</p>
            <span class="stat-label">Active listings</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #fff3e0;">
            <i data-lucide="shopping-bag" style="color: #f57c00;"></i>
          </div>
          <div class="stat-content">
            <h3>Total Orders</h3>
            <p class="stat-value">${mockStats.totalOrders}</p>
            <span class="stat-change positive">
              <i data-lucide="trending-up" style="width: 16px; height: 16px;"></i>
              +15% from last month
            </span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e8f5e9;">
            <i data-lucide="dollar-sign" style="color: #388e3c;"></i>
          </div>
          <div class="stat-content">
            <h3>Revenue</h3>
            <p class="stat-value">$${mockStats.revenue.toLocaleString()}</p>
            <span class="stat-change positive">
              <i data-lucide="trending-up" style="width: 16px; height: 16px;"></i>
              +22% from last month
            </span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #f3e5f5;">
            <i data-lucide="alert-circle" style="color: #7b1fa2;"></i>
          </div>
          <div class="stat-content">
            <h3>Active Orders</h3>
            <p class="stat-value">${mockStats.activeOrders}</p>
            <span class="stat-label">Needs attention</span>
          </div>
        </div>
      </div>

      <!-- Top Products Section -->
      <div class="dashboard-section">
        <div class="section-header">
          <h2>Top Products</h2>
          <button class="btn btn-text" data-nav="/seller/products">View All</button>
        </div>

        <div class="table-container">
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
              ${mockProducts.map(product => {
                const stockStatus = getStockStatus(product.stock);
                return `
                  <tr>
                    <td class="font-medium">${product.id}</td>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>${product.stock} ${product.unit}</td>
                    <td class="font-medium">$${product.price}/${product.unit}</td>
                    <td>${product.sales} units</td>
                    <td>
                      <span class="status-badge ${stockStatus.className}">
                        ${stockStatus.label}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="action-buttons">
          <button class="action-button" data-nav="/seller/products">
            <i data-lucide="package"></i>
            Manage Products
          </button>
          <button class="action-button" data-nav="/seller/orders">
            <i data-lucide="shopping-bag"></i>
            View Orders
          </button>
          <button class="action-button" data-nav="/seller/branches">
            <i data-lucide="git-branch"></i>
            Manage Branches
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
