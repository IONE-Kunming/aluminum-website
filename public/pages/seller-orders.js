import { renderPageWithLayout } from '../js/layout.js';

export function renderSellerOrders() {
  const content = `
    <div class="orders-page">
      <div class="page-header">
        <h1>Orders</h1>
        <p>Manage customer orders</p>
      </div>

      <div class="empty-state">
        <i data-lucide="shopping-bag" style="width: 64px; height: 64px; opacity: 0.3;"></i>
        <h2>No orders yet</h2>
        <p>Customer orders will appear here</p>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'seller');
  if (window.lucide) window.lucide.createIcons();
}
