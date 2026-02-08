import { renderPageWithLayout } from '../js/layout.js';
import languageManager from '../js/language.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml } from '../js/utils.js';

export async function renderOrders() {
  const t = languageManager.t.bind(languageManager);
  
  // Get current user
  const user = authManager.getCurrentUser();
  if (!user) {
    const content = `
      <div class="orders-page">
        <div class="page-header">
          <h1>${t('orders.myOrders')}</h1>
          <p>${t('orders.trackAndManage')}</p>
        </div>
        <div class="empty-state">
          <i data-lucide="alert-circle" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>Not Authenticated</h2>
          <p>Please log in to view your orders</p>
        </div>
      </div>
    `;
    renderPageWithLayout(content, 'buyer');
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  
  // Fetch orders for this buyer
  const orders = await dataService.getOrders({ buyerId: user.uid });
  
  const content = `
    <div class="orders-page">
      <div class="page-header">
        <h1>${t('orders.myOrders')}</h1>
        <p>${t('orders.trackAndManage')}</p>
      </div>

      ${orders.length === 0 ? `
        <div class="empty-state">
          <i data-lucide="package" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>${t('orders.noOrders')}</h2>
          <p>${t('orders.ordersWillAppear')}</p>
        </div>
      ` : `
        <div class="orders-list">
          ${orders.map(order => `
            <div class="order-card card">
              <div class="order-header">
                <div class="order-info">
                  <h3>Order #${order.id.substring(0, 8).toUpperCase()}</h3>
                  <span class="order-date">${order.createdAt && order.createdAt.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="order-status">
                  <span class="status-badge status-${order.status}">${order.status}</span>
                </div>
              </div>
              
              <div class="order-items">
                ${order.items.map(item => `
                  <div class="order-item">
                    <div class="order-item-info">
                      <h4>${escapeHtml(item.productName)}</h4>
                      <p class="text-muted">Seller: ${escapeHtml(item.seller)}</p>
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
                  <span>Deposit Paid (${order.depositPercentage}%):</span>
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

  renderPageWithLayout(content, 'buyer');
  if (window.lucide) window.lucide.createIcons();
}
