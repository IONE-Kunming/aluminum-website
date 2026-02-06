import { renderPageWithLayout } from '../js/layout.js';

export function renderOrders() {
  const content = `
    <div class="orders-page">
      <div class="page-header">
        <h1>My Orders</h1>
        <p>Track and manage your orders</p>
      </div>

      <div class="empty-state">
        <i data-lucide="package" style="width: 64px; height: 64px; opacity: 0.3;"></i>
        <h2>No orders yet</h2>
        <p>Your orders will appear here once you make a purchase</p>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  if (window.lucide) window.lucide.createIcons();
}
