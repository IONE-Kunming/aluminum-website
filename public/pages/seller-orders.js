import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml, formatDate } from '../js/utils.js';
import languageManager from '../js/language.js';
import router from '../js/router.js';

export async function renderSellerOrders() {
  const t = languageManager.t.bind(languageManager);

  const user = authManager.getCurrentUser();
  if (!user) {
    const content = `
      <div class="orders-page">
        <div class="page-header">
          <h1>${t('orders.manageCustomerOrders')}</h1>
          <p>${t('orders.trackAndManage')}</p>
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

  const userProfile = await dataService.getUserProfile(user.uid);
  if (!userProfile || userProfile.role !== 'seller') {
    const content = `
      <div class="orders-page">
        <div class="page-header">
          <h1>${t('orders.manageCustomerOrders')}</h1>
        </div>
        <div class="empty-state">
          <i data-lucide="shield-off" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>${t('auth.accessDenied') || 'Access Denied'}</h2>
          <p>${t('auth.sellerOnly') || 'This page is for sellers only.'}</p>
        </div>
      </div>
    `;
    renderPageWithLayout(content, 'seller');
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const allOrders = await dataService.getOrders({ sellerId: user.uid });
  allOrders.sort((a, b) => {
    const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
    const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
    return db - da;
  });

  const totalActive = allOrders.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s !== 'draft' && s !== 'collected';
  }).length;
  const completedOrders = allOrders.filter(o => (o.status || '').toLowerCase() === 'collected').length;
  const pendingReview = allOrders.filter(o => {
    const s = (o.status || '').toLowerCase();
    return s === 'under review' || s === 'pending';
  }).length;

  const PAGE_SIZE = 10;
  let currentPage = 1;
  let lastFiltered = allOrders;

  const renderSellerOrdersTable = (orders, page) => {
    const container = document.querySelector('.seller-orders-list-container');
    if (!container) return;

    const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
    page = Math.min(Math.max(1, page), totalPages);
    const pageOrders = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="shopping-bag" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>${t('orders.customerOrdersWillAppear')}</h2>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div class="card" style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
              <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px;">${t('orders.orderNumber')}</th>
              <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px;">${t('orders.date') || 'Date'}</th>
              <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px;">${t('orders.customer') || 'Customer'}</th>
              <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px; text-align: right;">${t('orders.items') || 'Items'}</th>
              <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px;">${t('orders.status') || 'Status'}</th>
              <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px; text-align: right;">${t('checkout.total') || 'Total'}</th>
              <th style="padding: 10px 12px;"></th>
            </tr>
          </thead>
          <tbody>
            ${pageOrders.map(order => `
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 12px; font-weight: 600; font-size: 14px;">#${order.id.substring(0, 8).toUpperCase()}</td>
                <td style="padding: 12px; color: var(--text-secondary); font-size: 13px;">${formatDate(order.createdAt)}</td>
                <td style="padding: 12px; font-size: 14px;">${escapeHtml(order.buyerName || order.buyerEmail || 'N/A')}</td>
                <td style="padding: 12px; text-align: right; font-size: 14px;">${order.items?.length || 0}</td>
                <td style="padding: 12px;"><span class="status-badge status-${order.status}">${escapeHtml(order.status)}</span></td>
                <td style="padding: 12px; text-align: right; font-size: 14px; font-weight: 600;">$${(order.total || 0).toFixed(2)}</td>
                <td style="padding: 12px; text-align: right;">
                  <button class="btn btn-secondary btn-sm view-seller-order-btn" data-order-id="${order.id}">
                    ${t('orders.viewDetails') || 'View Details'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${totalPages > 1 ? `
      <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 20px; flex-wrap: wrap;">
        <button class="btn btn-secondary btn-sm seller-order-page-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>&#8249; ${t('common.previous') || 'Previous'}</button>
        <span style="font-size: 14px; color: var(--text-secondary);">${t('common.page') || 'Page'} ${page} ${t('common.of') || 'of'} ${totalPages}</span>
        <button class="btn btn-secondary btn-sm seller-order-page-btn" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>${t('common.next') || 'Next'} &#8250;</button>
      </div>
      ` : ''}
    `;

    container.querySelectorAll('.view-seller-order-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        router.navigate(`/seller/order-detail?id=${btn.dataset.orderId}`);
      });
    });

    container.querySelectorAll('.seller-order-page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.dataset.page);
        renderSellerOrdersTable(lastFiltered, currentPage);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  };

  const content = `
    <div class="orders-page">
      <div class="page-header">
        <h1>${t('orders.manageCustomerOrders')}</h1>
        <p>${t('orders.trackAndManage')}</p>
      </div>

      <!-- Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('orders.totalOrders')}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">${allOrders.length}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('orders.activeOrders')}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">${totalActive}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('orders.completedOrders')}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">${completedOrders}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('orders.pendingReview')}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">${pendingReview}</p>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="filter-section card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0;">${t('orders.filterOrders') || 'Filter Orders'}</h3>
          <button class="btn btn-text btn-sm" id="resetFilters">
            <i data-lucide="x"></i>
            ${t('common.reset')}
          </button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
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

      <div class="seller-orders-list-container"></div>
    </div>
  `;

  renderPageWithLayout(content, 'seller');
  if (window.lucide) window.lucide.createIcons();

  renderSellerOrdersTable(allOrders, 1);

  const applyFilters = () => {
    const orderNumber = (document.getElementById('filterOrderNumber')?.value || '').toLowerCase();
    const dateFrom = document.getElementById('filterDateFrom')?.value || '';
    const dateTo = document.getElementById('filterDateTo')?.value || '';

    let filtered = allOrders;

    if (orderNumber) {
      filtered = filtered.filter(o => (o.id || '').toLowerCase().includes(orderNumber));
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter(o => {
        const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return d >= from;
      });
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(o => {
        const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return d <= to;
      });
    }

    lastFiltered = filtered;
    currentPage = 1;
    renderSellerOrdersTable(filtered, 1);
  };

  ['filterOrderNumber', 'filterDateFrom', 'filterDateTo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', applyFilters);
      el.addEventListener('change', applyFilters);
    }
  });

  const resetBtn = document.getElementById('resetFilters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      ['filterOrderNumber', 'filterDateFrom', 'filterDateTo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      lastFiltered = allOrders;
      currentPage = 1;
      renderSellerOrdersTable(allOrders, 1);
    });
  }
}
