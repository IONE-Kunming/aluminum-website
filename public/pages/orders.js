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
  
  // Fetch all orders for this buyer
  const allOrders = await dataService.getOrders({ buyerId: user.uid });
  
  // Separate draft orders from other orders
  const draftOrders = allOrders.filter(order => order.status === 'draft');
  const activeOrders = allOrders.filter(order => order.status !== 'draft');
  
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
          ${orders.map(order => `
            <div class="order-card card">
              <div class="order-header">
                <div class="order-info">
                  <h3>${t('orders.orderNumber')} #${order.id && order.id.length >= 8 ? order.id.substring(0, 8).toUpperCase() : (order.id || 'N/A').toUpperCase()}</h3>
                  <span class="order-date">${formatDate(order.createdAt)}</span>
                </div>
                <div class="order-status">
                  <span class="status-badge status-${order.status}">${order.status === 'draft' ? 'Draft' : order.status}</span>
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
                  <span class="text-warning">$${order.remainingBalance.toFixed(2)}</span>
                </div>
                <div class="order-payment-method">
                  <span>${t('checkout.paymentMethod')}:</span>
                  <span class="payment-badge">${order.paymentMethod}</span>
                </div>
                ` : ''}
              </div>
              
              <div class="order-actions" style="margin-top: 16px; display: flex; gap: 12px; justify-content: flex-end;">
                ${isDraft ? `
                  <button class="btn btn-primary checkout-draft-order-btn" data-order-id="${order.id}">
                    <i data-lucide="credit-card"></i>
                    ${t('orders.checkoutOrder') || 'Checkout Order'}
                  </button>
                ` : `
                  <button class="btn btn-secondary view-order-details-btn" data-order-id="${order.id}">
                    <i data-lucide="eye"></i>
                    ${t('orders.viewDetails') || 'View Details'}
                  </button>
                `}
              </div>
            </div>
          `).join('')}
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
              <label>${t('orders.buyerName')}</label>
              <input type="text" id="filterBuyerName" class="form-control" placeholder="${t('common.search')}...">
            </div>
            <div class="form-group">
              <label>${t('orders.buyerCompany')}</label>
              <input type="text" id="filterBuyerCompany" class="form-control" placeholder="${t('common.search')}...">
            </div>
            <div class="form-group">
              <label>${t('orders.email')}</label>
              <input type="text" id="filterEmail" class="form-control" placeholder="${t('common.search')}...">
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
    const buyerName = document.getElementById('filterBuyerName')?.value.toLowerCase() || '';
    const buyerCompany = document.getElementById('filterBuyerCompany')?.value.toLowerCase() || '';
    const email = document.getElementById('filterEmail')?.value.toLowerCase() || '';
    const dateFrom = document.getElementById('filterDateFrom')?.value || '';
    const dateTo = document.getElementById('filterDateTo')?.value || '';
    
    let filtered = activeOrders;
    
    // Filter by order number
    if (orderNumber) {
      filtered = filtered.filter(order => 
        (order.id || '').toLowerCase().includes(orderNumber)
      );
    }
    
    // Filter by buyer name
    if (buyerName) {
      filtered = filtered.filter(order => 
        (order.buyerName || '').toLowerCase().includes(buyerName)
      );
    }
    
    // Filter by buyer company
    if (buyerCompany) {
      filtered = filtered.filter(order => 
        (order.buyerCompany || '').toLowerCase().includes(buyerCompany)
      );
    }
    
    // Filter by email
    if (email) {
      filtered = filtered.filter(order => 
        (order.buyerEmail || '').toLowerCase().includes(email)
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
  ['filterOrderNumber', 'filterBuyerName', 'filterBuyerCompany', 'filterEmail', 'filterDateFrom', 'filterDateTo'].forEach(id => {
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
      ['filterOrderNumber', 'filterBuyerName', 'filterBuyerCompany', 'filterEmail', 'filterDateFrom', 'filterDateTo'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
      });
      renderOrdersList(allOrders);
    });
  }
}
