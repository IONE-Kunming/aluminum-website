import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml, formatDate } from '../js/utils.js';

export async function renderSellerOrders() {
  // Get current user (seller)
  const user = authManager.getCurrentUser();
  if (!user) {
    const content = `
      <div class="orders-page">
        <div class="page-header">
          <h1>Orders</h1>
          <p>Manage customer orders</p>
        </div>
        <div class="empty-state">
          <i data-lucide="alert-circle" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>Not Authenticated</h2>
          <p>Please log in to view orders</p>
        </div>
      </div>
    `;
    renderPageWithLayout(content, 'seller');
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  
  // Fetch orders for this seller
  const orders = await dataService.getOrders({ sellerId: user.uid });
  
  const content = `
    <div class="orders-page">
      <div class="page-header">
        <h1>Orders</h1>
        <p>Manage customer orders</p>
      </div>

      ${orders.length === 0 ? `
        <div class="empty-state">
          <i data-lucide="shopping-bag" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>No orders yet</h2>
          <p>Customer orders will appear here</p>
        </div>
      ` : `
        <div class="orders-list">
          ${orders.map(order => `
            <div class="order-card card">
              <div class="order-header">
                <div class="order-info">
                  <h3>Order #${order.id.substring(0, 8).toUpperCase()}</h3>
                  <span class="order-date">${formatDate(order.createdAt)}</span>
                </div>
                <div class="order-status">
                  <span class="status-badge status-${order.status}">${order.status}</span>
                </div>
              </div>
              
              <div class="order-buyer-info">
                <h4>Customer Information</h4>
                <p><strong>Name:</strong> ${escapeHtml(order.buyerName)}</p>
                <p><strong>Email:</strong> ${escapeHtml(order.buyerEmail)}</p>
                <p><strong>Company:</strong> ${escapeHtml(order.buyerCompany)}</p>
              </div>
              
              <div class="order-items">
                ${order.items.map(item => `
                  <div class="order-item">
                    <div class="order-item-info">
                      <h4>${escapeHtml(item.productName)}</h4>
                    </div>
                    <div class="order-item-details">
                      <span>${item.quantity} ${escapeHtml(item.unit || 'units')}</span>
                      <span class="order-item-price">$${item.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
              
              <div class="order-summary">
                <div class="order-summary-row">
                  <span>Subtotal:</span>
                  <span>$${order.subtotal.toFixed(2)}</span>
                </div>
                <div class="order-summary-row">
                  <span>Tax:</span>
                  <span>$${order.tax.toFixed(2)}</span>
                </div>
                <div class="order-summary-row">
                  <span>Total:</span>
                  <span class="order-total">$${order.total.toFixed(2)}</span>
                </div>
                <div class="order-summary-row">
                  <span>Deposit Received (${order.depositPercentage}%):</span>
                  <span class="text-success">$${order.depositAmount.toFixed(2)}</span>
                </div>
                <div class="order-summary-row">
                  <span>Remaining Balance:</span>
                  <span class="text-warning">$${order.remainingBalance.toFixed(2)}</span>
                </div>
                <div class="order-payment-method">
                  <span>Payment Method:</span>
                  <span class="payment-badge">${order.paymentMethod}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;

  renderPageWithLayout(content, 'seller');
  if (window.lucide) window.lucide.createIcons();
}
