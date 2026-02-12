import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml, formatDate } from '../js/utils.js';

export async function renderOrderDetail() {
  // Get order ID from URL query params
  const params = router.getQueryParams();
  const orderId = params.id;
  
  if (!orderId) {
    router.navigate('/seller/orders');
    return;
  }
  
  // Get current user
  const user = authManager.getCurrentUser();
  const profile = authManager.getUserProfile();
  
  if (!user || !profile) {
    router.navigate('/login');
    return;
  }
  
  // Fetch order details
  const order = await dataService.getOrderById(orderId);
  
  if (!order) {
    const content = `
      <div class="orders-page">
        <div class="page-header">
          <button class="btn btn-text" onclick="history.back()">
            <i data-lucide="arrow-left"></i> Back
          </button>
          <h1>Order Not Found</h1>
        </div>
        <div class="empty-state">
          <i data-lucide="alert-circle" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>Order not found</h2>
          <p>The order you're looking for doesn't exist or you don't have permission to view it.</p>
        </div>
      </div>
    `;
    renderPageWithLayout(content, profile.role);
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  
  // Determine if user can edit status (only sellers can edit their own orders)
  const canEditStatus = profile.role === 'seller' && order.sellerId === user.uid;
  
  const content = `
    <div class="orders-page">
      <div class="page-header">
        <div style="display: flex; align-items: center; gap: 16px;">
          <button class="btn btn-text" onclick="history.back()">
            <i data-lucide="arrow-left"></i> Back
          </button>
          <div>
            <h1>Order #${order.id && order.id.length >= 8 ? order.id.substring(0, 8).toUpperCase() : (order.id || 'N/A').toUpperCase()}</h1>
            <p>View and manage order details</p>
          </div>
        </div>
      </div>

      <div class="order-detail-container">
        <div class="order-detail-card card">
          <div class="order-detail-header">
            <div class="order-detail-info">
              <h2>Order Information</h2>
              <span class="order-date">${formatDate(order.createdAt)}</span>
            </div>
            <div class="order-detail-status">
              ${canEditStatus ? `
                <label style="font-weight: 500; margin-bottom: 8px; display: block;">Order Status:</label>
                <select class="status-select" id="order-status-select" data-order-id="${order.id}" data-current-status="${order.status}">
                  <option value="Under Review" ${order.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                  <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                  <option value="In Production" ${order.status === 'In Production' ? 'selected' : ''}>In Production</option>
                  <option value="Out Of Production" ${order.status === 'Out Of Production' ? 'selected' : ''}>Out Of Production</option>
                  <option value="Delivered to the Shipping Company" ${order.status === 'Delivered to the Shipping Company' ? 'selected' : ''}>Delivered to Shipping Company</option>
                  <option value="Reached Port" ${order.status === 'Reached Port' ? 'selected' : ''}>Reached Port</option>
                  <option value="Collected" ${order.status === 'Collected' ? 'selected' : ''}>Collected</option>
                </select>
              ` : `
                <label style="font-weight: 500; margin-bottom: 8px; display: block;">Order Status:</label>
                <span class="status-badge" style="font-size: 1rem; padding: 10px 16px;">${order.status}</span>
              `}
            </div>
          </div>
          
          <div class="order-detail-section">
            <h3>Customer Information</h3>
            <div class="order-detail-grid">
              <div class="detail-item">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${escapeHtml(order.buyerName)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${escapeHtml(order.buyerEmail)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Company:</span>
                <span class="detail-value">${escapeHtml(order.buyerCompany)}</span>
              </div>
              ${order.buyerPhone ? `
                <div class="detail-item">
                  <span class="detail-label">Phone:</span>
                  <span class="detail-value">${escapeHtml(order.buyerPhone)}</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          <div class="order-detail-section">
            <h3>Order Items</h3>
            <div class="order-items-table">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map(item => `
                    <tr>
                      <td>${escapeHtml(item.productName)}</td>
                      <td>${item.quantity} ${escapeHtml(item.unit || 'units')}</td>
                      <td>$${((item.subtotal || 0) / (item.quantity || 1)).toFixed(2)}</td>
                      <td>$${(item.subtotal || 0).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="order-detail-section">
            <h3>Payment Summary</h3>
            <div class="order-summary-large">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>$${(order.subtotal || 0).toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Tax:</span>
                <span>$${(order.tax || 0).toFixed(2)}</span>
              </div>
              <div class="summary-row total-row">
                <span>Total:</span>
                <span>$${(order.total || 0).toFixed(2)}</span>
              </div>
              <div class="summary-row highlight-row">
                <span>Deposit Received (${order.depositPercentage || 0}%):</span>
                <span class="text-success">$${(order.depositAmount || 0).toFixed(2)}</span>
              </div>
              <div class="summary-row highlight-row">
                <span>Remaining Balance:</span>
                <span class="text-warning">$${(order.remainingBalance || 0).toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Payment Method:</span>
                <span class="payment-badge">${order.paymentMethod || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  renderPageWithLayout(content, profile.role);
  if (window.lucide) window.lucide.createIcons();
  
  // Initialize status change handler if user can edit
  if (canEditStatus) {
    initializeStatusSelect();
  }
}

// Initialize status select dropdown
function initializeStatusSelect() {
  const statusSelect = document.getElementById('order-status-select');
  
  if (!statusSelect) return;
  
  statusSelect.addEventListener('change', async (e) => {
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
}
