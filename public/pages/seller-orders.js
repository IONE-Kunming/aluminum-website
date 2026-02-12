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
                  <h3>Order #${order.id && order.id.length >= 8 ? order.id.substring(0, 8).toUpperCase() : (order.id || 'N/A').toUpperCase()}</h3>
                  <span class="order-date">${formatDate(order.createdAt)}</span>
                </div>
                <div class="order-status">
                  <select class="status-select" data-order-id="${order.id}" data-current-status="${order.status}">
                    <option value="Under Review" ${order.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                    <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="In Production" ${order.status === 'In Production' ? 'selected' : ''}>In Production</option>
                    <option value="Out Of Production" ${order.status === 'Out Of Production' ? 'selected' : ''}>Out Of Production</option>
                    <option value="Delivered to the Shipping Company" ${order.status === 'Delivered to the Shipping Company' ? 'selected' : ''}>Delivered to Shipping Company</option>
                    <option value="Reached Port" ${order.status === 'Reached Port' ? 'selected' : ''}>Reached Port</option>
                    <option value="Collected" ${order.status === 'Collected' ? 'selected' : ''}>Collected</option>
                  </select>
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
  
  // Add event listeners for status changes
  initializeStatusSelects();
}

// Initialize status select dropdowns
function initializeStatusSelects() {
  const statusSelects = document.querySelectorAll('.status-select');
  
  statusSelects.forEach(select => {
    select.addEventListener('change', async (e) => {
      const orderId = e.target.getAttribute('data-order-id');
      const currentStatus = e.target.getAttribute('data-current-status');
      const newStatus = e.target.value;
      
      if (newStatus === currentStatus) {
        return; // No change
      }
      
      // Confirm the status change
      if (!confirm(`Are you sure you want to change the order status to "${newStatus}"?`)) {
        e.target.value = currentStatus; // Revert selection
        return;
      }
      
      try {
        // Disable select while updating
        e.target.disabled = true;
        
        // Update status in database
        await dataService.updateOrderStatus(orderId, newStatus);
        
        // Update the data attribute for future changes
        e.target.setAttribute('data-current-status', newStatus);
        
        // Show success message
        if (window.toast) {
          window.toast.success(`Order status updated to "${newStatus}"`);
        }
      } catch (error) {
        console.error('Error updating order status:', error);
        
        // Revert the selection on error
        e.target.value = currentStatus;
        
        // Show error message
        if (window.toast) {
          window.toast.error('Failed to update order status. Please try again.');
        }
      } finally {
        // Re-enable select
        e.target.disabled = false;
      }
    });
  });
}
