import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml, formatDate } from '../js/utils.js';
import languageManager from '../js/language.js';

export async function renderSellerOrders() {
  const t = languageManager.t.bind(languageManager);
  
  // Get current user (seller)
  const user = authManager.getCurrentUser();
  if (!user) {
    const content = `
      <div class="orders-page">
        <div class="page-header">
          <h1>${t('orders.title')}</h1>
          <p>${t('orders.manageCustomerOrders')}</p>
        </div>
        <div class="empty-state">
          <i data-lucide="alert-circle" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>${t('auth.notAuthenticated')}</h2>
          <p>${t('auth.pleaseLoginToViewOrders')}</p>
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
        <h1>${t('orders.title')}</h1>
        <p>${t('orders.manageCustomerOrders')}</p>
      </div>

      ${orders.length === 0 ? `
        <div class="empty-state">
          <i data-lucide="shopping-bag" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>No orders yet</h2>
          <p>Customer orders will appear here</p>
        </div>
      ` : `
        <!-- Filter Controls -->
        <div class="order-filters card" style="margin-bottom: 24px; padding: 20px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
            <div class="form-group" style="margin: 0;">
              <label for="filter-order-number" style="display: block; margin-bottom: 8px; font-weight: 500;">Order Number</label>
              <input type="text" id="filter-order-number" class="form-control" placeholder="Search by order number..." />
            </div>
            <div class="form-group" style="margin: 0;">
              <label for="filter-date-from" style="display: block; margin-bottom: 8px; font-weight: 500;">Date From</label>
              <input type="date" id="filter-date-from" class="form-control" />
            </div>
            <div class="form-group" style="margin: 0;">
              <label for="filter-date-to" style="display: block; margin-bottom: 8px; font-weight: 500;">Date To</label>
              <input type="date" id="filter-date-to" class="form-control" />
            </div>
            <div class="form-group" style="margin: 0;">
              <label for="filter-status" style="display: block; margin-bottom: 8px; font-weight: 500;">Status</label>
              <select id="filter-status" class="form-control">
                <option value="">All Statuses</option>
                <option value="Under Review">Under Review</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Production">In Production</option>
                <option value="Out Of Production">Out Of Production</option>
                <option value="Delivered to the Shipping Company">Delivered to Shipping Company</option>
                <option value="Reached Port">Reached Port</option>
                <option value="Collected">Collected</option>
              </select>
            </div>
          </div>
          <div style="margin-top: 16px; display: flex; gap: 12px;">
            <button class="btn btn-primary" id="apply-filters-btn">
              <i data-lucide="filter"></i>
              Apply Filters
            </button>
            <button class="btn btn-secondary" id="clear-filters-btn">
              <i data-lucide="x"></i>
              Clear
            </button>
          </div>
        </div>

        <div class="orders-list" id="orders-list">
          ${orders.map(order => `
            <div class="order-card-compact card clickable" data-order-id="${order.id}">
              <div class="order-compact-content">
                <div class="order-compact-info">
                  <h3>Order #${order.id && order.id.length >= 8 ? order.id.substring(0, 8).toUpperCase() : (order.id || 'N/A').toUpperCase()}</h3>
                  <span class="order-date">${formatDate(order.createdAt)}</span>
                </div>
                <div class="order-compact-buyer">
                  <span class="buyer-label">Customer:</span>
                  <span class="buyer-name">${escapeHtml(order.buyerName)}</span>
                </div>
                <div class="order-compact-status">
                  <span class="status-badge">${order.status}</span>
                </div>
                <div class="order-compact-action">
                  <i data-lucide="chevron-right"></i>
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
  
  // Add event listeners for order cards
  initializeOrderCards();
  
  // Add event listeners for filters
  initializeFilters(orders);
}

// Initialize order card click handlers
function initializeOrderCards() {
  const orderCards = document.querySelectorAll('.order-card-compact.clickable');
  
  orderCards.forEach(card => {
    card.addEventListener('click', () => {
      const orderId = card.getAttribute('data-order-id');
      if (orderId) {
        router.navigate(`/order/detail?id=${orderId}`);
      }
    });
    
    // Add hover effect
    card.style.cursor = 'pointer';
  });
}

// Initialize filter functionality
function initializeFilters(allOrders) {
  const applyFiltersBtn = document.getElementById('apply-filters-btn');
  const clearFiltersBtn = document.getElementById('clear-filters-btn');
  const filterOrderNumber = document.getElementById('filter-order-number');
  const filterDateFrom = document.getElementById('filter-date-from');
  const filterDateTo = document.getElementById('filter-date-to');
  const filterStatus = document.getElementById('filter-status');
  const ordersList = document.getElementById('orders-list');
  
  if (!applyFiltersBtn || !ordersList) return;
  
  // Apply filters function
  const applyFilters = () => {
    const orderNumberFilter = filterOrderNumber.value.toLowerCase().trim();
    const dateFromFilter = filterDateFrom.value;
    const dateToFilter = filterDateTo.value;
    const statusFilter = filterStatus.value;
    
    // Filter orders
    const filteredOrders = allOrders.filter(order => {
      // Order number filter
      if (orderNumberFilter && !order.id.toLowerCase().includes(orderNumberFilter)) {
        return false;
      }
      
      // Date from filter
      if (dateFromFilter && order.createdAt) {
        const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        const fromDate = new Date(dateFromFilter);
        if (orderDate < fromDate) {
          return false;
        }
      }
      
      // Date to filter
      if (dateToFilter && order.createdAt) {
        const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        const toDate = new Date(dateToFilter);
        toDate.setHours(23, 59, 59, 999); // End of day
        if (orderDate > toDate) {
          return false;
        }
      }
      
      // Status filter
      if (statusFilter && order.status !== statusFilter) {
        return false;
      }
      
      return true;
    });
    
    // Re-render orders list
    ordersList.innerHTML = filteredOrders.map(order => `
      <div class="order-card-compact card clickable" data-order-id="${order.id}">
        <div class="order-compact-content">
          <div class="order-compact-info">
            <h3>Order #${order.id && order.id.length >= 8 ? order.id.substring(0, 8).toUpperCase() : (order.id || 'N/A').toUpperCase()}</h3>
            <span class="order-date">${formatDate(order.createdAt)}</span>
          </div>
          <div class="order-compact-buyer">
            <span class="buyer-label">Customer:</span>
            <span class="buyer-name">${escapeHtml(order.buyerName)}</span>
          </div>
          <div class="order-compact-status">
            <span class="status-badge">${order.status}</span>
          </div>
          <div class="order-compact-action">
            <i data-lucide="chevron-right"></i>
          </div>
        </div>
      </div>
    `).join('');
    
    // Show empty state if no results
    if (filteredOrders.length === 0) {
      ordersList.innerHTML = `
        <div class="empty-state">
          <i data-lucide="filter-x" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>No orders match your filters</h2>
          <p>Try adjusting your filter criteria</p>
        </div>
      `;
    }
    
    // Reinitialize lucide icons and click handlers
    if (window.lucide) window.lucide.createIcons();
    initializeOrderCards();
    
    // Show toast
    if (window.toast) {
      window.toast.success(`Found ${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''}`);
    }
  };
  
  // Clear filters function
  const clearFilters = () => {
    filterOrderNumber.value = '';
    filterDateFrom.value = '';
    filterDateTo.value = '';
    filterStatus.value = '';
    applyFilters();
  };
  
  // Add event listeners
  applyFiltersBtn.addEventListener('click', applyFilters);
  clearFiltersBtn.addEventListener('click', clearFilters);
  
  // Allow Enter key to apply filters
  [filterOrderNumber, filterDateFrom, filterDateTo, filterStatus].forEach(input => {
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          applyFilters();
        }
      });
    }
  });
}
