import { renderPageWithLayout } from '../js/layout.js';
import languageManager from '../js/language.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml, formatDate } from '../js/utils.js';
import router from '../js/router.js';

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
          <h2>${t('auth.notAuthenticated')}</h2>
          <p>${t('auth.pleaseLoginToViewOrders')}</p>
        </div>
      </div>
    `;
    renderPageWithLayout(content, 'buyer');
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  
  // Fetch all orders for this buyer (already sorted descending by dataService)
  const allOrders = await dataService.getOrders({ buyerId: user.uid });
  
  // Separate draft orders from other orders
  const draftOrders = allOrders.filter(order => order.status === 'draft');
  // Sort active orders descending by createdAt (newest first)
  const activeOrders = allOrders
    .filter(order => order.status !== 'draft')
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB - dateA;
    });
  
  const renderOrdersList = (orders, isDraft = false) => {
    const ordersList = document.querySelector(isDraft ? '.draft-orders-list-container' : '.orders-list-container');
    if (!ordersList) return;
    
    if (orders.length === 0) {
      ordersList.innerHTML = `
        <div class="empty-state">
          <i data-lucide="package" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>${isDraft ? (t('orders.noDraftOrders') || 'No draft orders') : t('orders.noOrders')}</h2>
          <p>${isDraft ? (t('orders.draftOrdersWillAppear') || 'Draft orders will appear here when you add items to cart') : t('orders.ordersWillAppear')}</p>
        </div>
      `;
    } else {
      ordersList.innerHTML = `
        <div class="orders-list">
          ${orders.map(order => {
            const isDepositPaid = !isDraft && order.paymentStatus === 'deposit_paid';
            const isFullyPaid = !isDraft && order.paymentStatus === 'paid';
            const remainingBalance = order.remainingBalance || 0;
            return `
            <div class="order-card card">
              <div class="order-header">
                <div class="order-info">
                  <h3>${t('orders.orderNumber')} #${order.id && order.id.length >= 8 ? order.id.substring(0, 8).toUpperCase() : (order.id || 'N/A').toUpperCase()}</h3>
                  <span class="order-date">${formatDate(order.createdAt)}</span>
                </div>
                <div class="order-status" style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                  <span class="status-badge status-${order.status}">${order.status === 'draft' ? 'Draft' : order.status}</span>
                  ${!isDraft ? (() => {
                    if (isFullyPaid) return `<span class="status-badge status-paid">${t('orders.fullyPaid') || 'Paid'}</span>`;
                    if (isDepositPaid) return `<span class="status-badge status-deposit-paid">${t('orders.depositPaid') || 'Deposit Paid'}</span>`;
                    return '';
                  })() : ''}
                </div>
              </div>
              
              <div class="order-items">
                ${order.items.map(item => `
                  <div class="order-item">
                    <div class="order-item-info">
                      <h4>${escapeHtml(item.productName)}</h4>
                      <p class="text-muted">${t('orders.seller')}: ${escapeHtml(item.seller)}</p>
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
                  <span>${t('checkout.subtotal')}:</span>
                  <span>$${order.subtotal.toFixed(2)}</span>
                </div>
                <div class="order-summary-row">
                  <span>${t('checkout.tax')}:</span>
                  <span>$${order.tax.toFixed(2)}</span>
                </div>
                <div class="order-summary-row">
                  <span>${t('checkout.total')}:</span>
                  <span class="order-total">$${order.total.toFixed(2)}</span>
                </div>
                ${!isDraft ? `
                <div class="order-summary-row">
                  <span>${t('checkout.depositAmountLabel')} (${order.depositPercentage}%):</span>
                  <span class="text-success">$${order.depositAmount.toFixed(2)}</span>
                </div>
                <div class="order-summary-row">
                  <span>${t('checkout.remainingBalance')}:</span>
                  <span class="text-warning">$${remainingBalance.toFixed(2)}</span>
                </div>
                <div class="order-payment-method">
                  <span>${t('checkout.paymentMethod')}:</span>
                  <span class="payment-badge">${order.paymentMethod}</span>
                </div>
                ` : ''}
              </div>
              
              ${isDepositPaid ? `
              <div class="pay-now-section" id="pay-now-section-${order.id}" style="display: none; margin-top: 16px; padding: 16px; background: var(--background-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
                <h4 style="margin: 0 0 12px;">${t('orders.payNow') || 'Pay Now'}</h4>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                  <label style="flex-shrink: 0;">${t('orders.paymentAmount') || 'Payment Amount'}:</label>
                  <div style="display: flex; flex: 1; gap: 8px;">
                    <input type="number" class="form-control pay-now-amount-input" id="pay-now-amount-${order.id}"
                      min="0.01" max="${remainingBalance.toFixed(2)}" step="0.01"
                      placeholder="${t('orders.enterAmount') || 'Enter amount to pay'}"
                      style="flex: 1;" />
                    <button class="btn btn-secondary btn-sm pay-now-maximum-btn" data-order-id="${order.id}" data-max="${remainingBalance.toFixed(2)}" style="flex-shrink: 0;">
                      ${t('orders.maximum') || 'Maximum'}
                    </button>
                  </div>
                </div>
                <div class="payment-methods" style="margin-bottom: 12px;">
                  <label style="display: block; margin-bottom: 8px;">${t('checkout.paymentMethod')}:</label>
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <label class="pay-now-method-label" style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 12px; border: 1px solid var(--border-color); border-radius: 6px;">
                      <input type="radio" name="pay-now-method-${order.id}" value="alipay" style="margin: 0;" /> ${t('checkout.alipay') || 'Alipay'}
                    </label>
                    <label class="pay-now-method-label" style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 12px; border: 1px solid var(--border-color); border-radius: 6px;">
                      <input type="radio" name="pay-now-method-${order.id}" value="wechat" style="margin: 0;" /> ${t('checkout.wechat') || 'WeChat Pay'}
                    </label>
                    <label class="pay-now-method-label" style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 12px; border: 1px solid var(--border-color); border-radius: 6px;">
                      <input type="radio" name="pay-now-method-${order.id}" value="bank" style="margin: 0;" /> ${t('checkout.bankTransfer') || 'Bank Transfer'}
                    </label>
                    <label class="pay-now-method-label" style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 12px; border: 1px solid var(--border-color); border-radius: 6px;">
                      <input type="radio" name="pay-now-method-${order.id}" value="card" style="margin: 0;" /> ${t('checkout.cardPayment') || 'Card Payment'}
                    </label>
                  </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                  <button class="btn btn-secondary btn-sm pay-now-cancel-btn" data-order-id="${order.id}">${t('common.cancel') || 'Cancel'}</button>
                  <button class="btn btn-primary btn-sm pay-now-confirm-btn" data-order-id="${order.id}" data-remaining="${remainingBalance.toFixed(2)}">
                    <i data-lucide="check-circle"></i>
                    ${t('orders.confirmPayment') || 'Confirm Payment'}
                  </button>
                </div>
              </div>
              ` : ''}
              
              <div class="order-actions" style="margin-top: 16px; display: flex; gap: 12px; justify-content: flex-end;">
                ${isDraft ? `
                  <button class="btn btn-primary checkout-draft-order-btn" data-order-id="${order.id}">
                    <i data-lucide="credit-card"></i>
                    ${t('orders.checkoutOrder') || 'Checkout Order'}
                  </button>
                ` : `
                  ${isDepositPaid ? `
                    <button class="btn btn-primary pay-now-toggle-btn" data-order-id="${order.id}">
                      <i data-lucide="credit-card"></i>
                      ${t('orders.payNow') || 'Pay Now'}
                    </button>
                  ` : ''}
                  <button class="btn btn-secondary view-order-details-btn" data-order-id="${order.id}">
                    <i data-lucide="eye"></i>
                    ${t('orders.viewDetails') || 'View Details'}
                  </button>
                `}
              </div>
            </div>
          `}).join('')}
        </div>
      `;
    }
    
    // Add event listeners for checkout buttons
    if (isDraft) {
      document.querySelectorAll('.checkout-draft-order-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const orderId = btn.getAttribute('data-order-id');
          await handleCheckoutDraftOrder(orderId);
        });
      });
    }
    
    // Pay Now toggle
    document.querySelectorAll('.pay-now-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-order-id');
        const section = document.getElementById(`pay-now-section-${orderId}`);
        if (section) {
          section.style.display = section.style.display === 'none' ? 'block' : 'none';
        }
      });
    });
    
    // Maximum button
    document.querySelectorAll('.pay-now-maximum-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-order-id');
        const max = btn.getAttribute('data-max');
        const input = document.getElementById(`pay-now-amount-${orderId}`);
        if (input) input.value = max;
      });
    });
    
    // Cancel button
    document.querySelectorAll('.pay-now-cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-order-id');
        const section = document.getElementById(`pay-now-section-${orderId}`);
        if (section) section.style.display = 'none';
      });
    });
    
    // Confirm payment button
    document.querySelectorAll('.pay-now-confirm-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const orderId = btn.getAttribute('data-order-id');
        const remaining = parseFloat(btn.getAttribute('data-remaining'));
        const input = document.getElementById(`pay-now-amount-${orderId}`);
        const amount = parseFloat(input?.value);
        const selectedMethod = document.querySelector(`input[name="pay-now-method-${orderId}"]:checked`);
        
        if (!amount || amount <= 0) {
          window.toast.error(t('orders.invalidAmount') || 'Please enter a valid amount');
          return;
        }
        if (amount > remaining + 0.001) {
          window.toast.error(t('orders.amountExceedsBalance') || 'Amount cannot exceed the remaining balance');
          return;
        }
        if (!selectedMethod) {
          window.toast.error(t('checkout.selectDepositAndPayment') || 'Please select a payment method');
          return;
        }
        
        btn.disabled = true;
        btn.innerHTML = `<i data-lucide="loader"></i> ${t('checkout.processing') || 'Processing...'}`;
        if (window.lucide) window.lucide.createIcons();
        
        try {
          const result = await dataService.processPartialPayment(orderId, amount, selectedMethod.value);
          const msg = result.fullyPaid
            ? (t('orders.payNowFullyPaid') || 'Order fully paid!')
            : (t('orders.payNowSuccess') || 'Payment successful!');
          window.toast.success(msg);
          
          // Re-fetch and re-render the orders list
          const updatedOrders = await dataService.getOrders({ buyerId: user.uid });
          const updatedActive = updatedOrders.filter(o => o.status !== 'draft');
          renderOrdersList(updatedActive, false);
        } catch (error) {
          console.error('Pay now error:', error);
          window.toast.error(t('orders.paymentFailed') || 'Payment failed. Please try again.');
          btn.disabled = false;
          btn.innerHTML = `<i data-lucide="check-circle"></i> ${t('orders.confirmPayment') || 'Confirm Payment'}`;
          if (window.lucide) window.lucide.createIcons();
        }
      });
    });
    
    if (window.lucide) window.lucide.createIcons();
  };

  const content = `
    <div class="orders-page">
      <div class="page-header">
        <h1>${t('orders.myOrders')}</h1>
        <p>${t('orders.trackAndManage')}</p>
      </div>
      
      <!-- Draft Orders Section -->
      ${draftOrders.length > 0 ? `
      <div class="draft-orders-section" style="margin-bottom: 48px;">
        <div class="section-header" style="display: flex; align-items: center; margin-bottom: 24px;">
          <h2 style="margin: 0;">${t('orders.draftOrders') || 'Draft Orders'}</h2>
          <span class="badge" style="margin-left: 12px; background: var(--warning-color); color: white; padding: 4px 12px; border-radius: 12px; font-size: 14px;">${draftOrders.length}</span>
        </div>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">
          ${t('orders.draftOrdersDescription') || 'These are your draft orders waiting to be checked out. Each order is for a different seller and needs to be paid separately.'}
        </p>
        <div class="draft-orders-list-container">
          <!-- Draft orders will be rendered here -->
        </div>
      </div>
      ` : ''}
      
      <!-- Active Orders Section -->
      <div class="active-orders-section">
        <h2 style="margin-bottom: 24px;">${t('orders.activeOrders') || 'Active Orders'}</h2>
        
        <!-- Filter Section -->
        <div class="filter-section card" style="margin-bottom: 24px;">
          <div class="filter-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="margin: 0;">${t('orders.filterOrders')}</h3>
            <button class="btn btn-text btn-sm" id="resetFilters">
              <i data-lucide="x"></i>
              ${t('common.reset')}
            </button>
          </div>
          <div class="filter-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <div class="form-group">
              <label>${t('orders.orderNumber')}</label>
              <input type="text" id="filterOrderNumber" class="form-control" placeholder="${t('common.search')}...">
            </div>
            <div class="form-group">
              <label>${t('common.from')}</label>
              <input type="date" id="filterDateFrom" class="form-control">
            </div>
            <div class="form-group">
              <label>${t('common.to')}</label>
              <input type="date" id="filterDateTo" class="form-control">
            </div>
          </div>
        </div>

        <div class="orders-list-container">
          <!-- Orders will be rendered here -->
        </div>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  if (window.lucide) window.lucide.createIcons();
  
  // Handler for checkout draft order
  const handleCheckoutDraftOrder = async (orderId) => {
    try {
      // Navigate to a single order checkout page
      router.navigate(`/buyer/order-checkout?id=${orderId}`);
    } catch (error) {
      console.error('Error navigating to checkout:', error);
      window.toast.error(t('orders.checkoutError') || 'Failed to checkout order');
    }
  };
  
  // Initial render
  if (draftOrders.length > 0) {
    renderOrdersList(draftOrders, true);
  }
  renderOrdersList(activeOrders, false);
  
  // Filter function
  const applyFilters = () => {
    const orderNumber = document.getElementById('filterOrderNumber')?.value.toLowerCase() || '';
    const dateFrom = document.getElementById('filterDateFrom')?.value || '';
    const dateTo = document.getElementById('filterDateTo')?.value || '';
    
    let filtered = activeOrders;
    
    // Filter by order number
    if (orderNumber) {
      filtered = filtered.filter(order => 
        (order.id || '').toLowerCase().includes(orderNumber)
      );
    }
    
    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        return orderDate >= fromDate;
      });
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        return orderDate <= toDate;
      });
    }
    
    renderOrdersList(filtered, false);
  };
  
  // Add event listeners for filters
  ['filterOrderNumber', 'filterDateFrom', 'filterDateTo'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', applyFilters);
      element.addEventListener('change', applyFilters);
    }
  });
  
  // Reset filters
  const resetButton = document.getElementById('resetFilters');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      ['filterOrderNumber', 'filterDateFrom', 'filterDateTo'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
      });
      renderOrdersList(activeOrders);
    });
  }
}
