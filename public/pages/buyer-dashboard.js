import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import authManager from '../js/auth.js';

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
    seller: 'AlumaTech Industries'
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
    seller: 'AlumaTech Industries'
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
  
  const content = `
    <div class="dashboard-page">
      <div class="dashboard-header">
        <div>
          <h1>Welcome back, ${profile?.displayName || 'User'}!</h1>
          <p class="dashboard-subtitle">Here's what's happening with your orders today</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e3f2fd;">
            <i data-lucide="package" style="color: #1976d2;"></i>
          </div>
          <div class="stat-content">
            <h3>Total Orders</h3>
            <p class="stat-value">${mockStats.totalOrders}</p>
            <span class="stat-change positive">
              <i data-lucide="trending-up" style="width: 16px; height: 16px;"></i>
              +12% from last month
            </span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #fff3e0;">
            <i data-lucide="clock" style="color: #f57c00;"></i>
          </div>
          <div class="stat-content">
            <h3>Active Orders</h3>
            <p class="stat-value">${mockStats.activeOrders}</p>
            <span class="stat-label">Currently in progress</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #e8f5e9;">
            <i data-lucide="dollar-sign" style="color: #388e3c;"></i>
          </div>
          <div class="stat-content">
            <h3>Total Spent</h3>
            <p class="stat-value">$${mockStats.totalSpent.toLocaleString()}</p>
            <span class="stat-change positive">
              <i data-lucide="trending-up" style="width: 16px; height: 16px;"></i>
              +8% from last month
            </span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background-color: #f3e5f5;">
            <i data-lucide="check-circle" style="color: #7b1fa2;"></i>
          </div>
          <div class="stat-content">
            <h3>Completed</h3>
            <p class="stat-value">${mockStats.completedOrders}</p>
            <span class="stat-label">Successfully delivered</span>
          </div>
        </div>
      </div>

      <!-- Recent Orders Section -->
      <div class="dashboard-section">
        <div class="section-header">
          <h2>Recent Orders</h2>
          <button class="btn btn-text" data-nav="/buyer/orders">View All</button>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Seller</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${mockRecentOrders.map(order => `
                <tr>
                  <td class="font-medium">${order.id}</td>
                  <td>${order.date}</td>
                  <td>${order.product}</td>
                  <td>${order.quantity}</td>
                  <td>${order.seller}</td>
                  <td class="font-medium">$${order.total.toLocaleString()}</td>
                  <td>
                    <span class="status-badge ${getStatusColor(order.status)}">
                      ${order.status}
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
        <h2>Quick Actions</h2>
        <div class="action-buttons">
          <button class="action-button" data-nav="/buyer/catalog">
            <i data-lucide="shopping-cart"></i>
            Browse Catalog
          </button>
          <button class="action-button" data-nav="/buyer/orders">
            <i data-lucide="package"></i>
            View Orders
          </button>
          <button class="action-button" data-nav="/buyer/sellers">
            <i data-lucide="store"></i>
            Find Sellers
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
