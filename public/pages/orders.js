import { renderPageWithLayout } from '../js/layout.js';
import languageManager from '../js/language.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml, formatDate } from '../js/utils.js';

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
  
  const renderOrdersList = (orders) => {
    const ordersList = document.querySelector('.orders-list-container');
    if (!ordersList) return;
    
    if (orders.length === 0) {
      ordersList.innerHTML = `
        <div class="empty-state">
          <i data-lucide="package" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>${t('orders.noOrders')}</h2>
          <p>${t('orders.ordersWillAppear')}</p>
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
                  <span class="status-badge status-${order.status}">${order.status}</span>
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
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    if (window.lucide) window.lucide.createIcons();
  };

  const content = `
    <div class="orders-page">
      <div class="page-header">
        <h1>${t('orders.myOrders')}</h1>
        <p>${t('orders.trackAndManage')}</p>
      </div>
      
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
  `;

  renderPageWithLayout(content, 'buyer');
  if (window.lucide) window.lucide.createIcons();
  
  // Initial render
  renderOrdersList(allOrders);
  
  // Filter function
  const applyFilters = () => {
    const orderNumber = document.getElementById('filterOrderNumber')?.value.toLowerCase() || '';
    const buyerName = document.getElementById('filterBuyerName')?.value.toLowerCase() || '';
    const buyerCompany = document.getElementById('filterBuyerCompany')?.value.toLowerCase() || '';
    const email = document.getElementById('filterEmail')?.value.toLowerCase() || '';
    const dateFrom = document.getElementById('filterDateFrom')?.value || '';
    const dateTo = document.getElementById('filterDateTo')?.value || '';
    
    let filtered = allOrders;
    
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
    
    renderOrdersList(filtered);
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
