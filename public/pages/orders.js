import { renderPageWithLayout } from '../js/layout.js';
import languageManager from '../js/language.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml, formatDate } from '../js/utils.js';
import router from '../js/router.js';

export async function renderOrders() {
  const t = languageManager.t.bind(languageManager);

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

  const allOrders = await dataService.getOrders({ buyerId: user.uid });

  const draftOrders = allOrders
    .filter(o => o.status === 'draft')
    .sort((a, b) => {
      const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return db - da;
    });

  const activeOrders = allOrders
    .filter(o => o.status !== 'draft')
    .sort((a, b) => {
      const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return db - da;
    });

  const { totalSpent, totalDeposit, totalRemaining } = activeOrders.reduce(
    (acc, o) => ({
      totalSpent: acc.totalSpent + (o.total || 0),
      totalDeposit: acc.totalDeposit + (o.depositAmount || 0),
      totalRemaining: acc.totalRemaining + (o.remainingBalance || 0),
    }),
    { totalSpent: 0, totalDeposit: 0, totalRemaining: 0 }
  );

  const PAGE_SIZE = 10;
  let currentPage = 1;
  let lastFiltered = activeOrders;

  const renderDraftOrdersTable = (orders) => {
    const container = document.querySelector('.draft-orders-list-container');
    if (!container) return;

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="package" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>${t('orders.noDraftOrders')}</h2>
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
              <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px;">${t('orders.seller') || 'Seller'}</th>
              <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px; text-align: right;">${t('orders.items') || 'Items'}</th>
              <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px; text-align: right;">${t('checkout.total') || 'Total'}</th>
              <th style="padding: 10px 12px;"></th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(order => `
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 12px; font-weight: 600; font-size: 14px;">#${order.id.substring(0, 8).toUpperCase()}</td>
                <td style="padding: 12px; color: var(--text-secondary); font-size: 13px;">${formatDate(order.createdAt)}</td>
                <td style="padding: 12px; font-size: 14px;">${escapeHtml(order.sellerName || 'N/A')}</td>
                <td style="padding: 12px; text-align: right; font-size: 14px;">${order.items?.length || 0}</td>
                <td style="padding: 12px; text-align: right; font-size: 14px; font-weight: 600;">$${(order.total || 0).toFixed(2)}</td>
                <td style="padding: 12px; text-align: right;">
                  <button class="btn btn-primary btn-sm checkout-draft-btn" data-order-id="${order.id}">
                    ${t('orders.checkoutOrder') || 'Checkout'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('.checkout-draft-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        router.navigate(`/buyer/order-checkout?id=${btn.dataset.orderId}`);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  };

  const renderActiveOrdersTable = (orders, page) => {
    const container = document.querySelector('.orders-list-container');
    if (!container) return;

    const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
    page = Math.min(Math.max(1, page), totalPages);
    const pageOrders = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="package" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>${t('orders.noOrders')}</h2>
          <p>${t('orders.ordersWillAppear')}</p>
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
              <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px;">${t('orders.status') || 'Status'}</th>
              <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px; text-align: right;">${t('checkout.total') || 'Total'}</th>
              <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px; text-align: right;">${t('orders.amountPaid') || 'Deposit Paid'}</th>
              <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px; text-align: right;">${t('invoices.remainingBalance') || 'Remaining'}</th>
              <th style="padding: 10px 12px;"></th>
            </tr>
          </thead>
          <tbody>
            ${pageOrders.map(order => `
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 12px; font-weight: 600; font-size: 14px;">#${order.id.substring(0, 8).toUpperCase()}</td>
                <td style="padding: 12px; color: var(--text-secondary); font-size: 13px;">${formatDate(order.createdAt)}</td>
                <td style="padding: 12px;"><span class="status-badge status-${order.status}">${escapeHtml(order.status)}</span></td>
                <td style="padding: 12px; text-align: right; font-size: 14px; font-weight: 600;">$${(order.total || 0).toFixed(2)}</td>
                <td style="padding: 12px; text-align: right; font-size: 14px; color: var(--success-color);">$${(order.depositAmount || 0).toFixed(2)}</td>
                <td style="padding: 12px; text-align: right; font-size: 14px; color: var(--warning-color);">$${(order.remainingBalance || 0).toFixed(2)}</td>
                <td style="padding: 12px; text-align: right; white-space: nowrap;">
                  ${order.paymentStatus === 'deposit_paid' ? `
                    <button class="btn btn-primary btn-sm pay-now-btn" data-order-id="${order.id}" style="margin-right: 6px;">
                      ${t('orders.payNow') || 'Pay Now'}
                    </button>
                  ` : ''}
                  <button class="btn btn-secondary btn-sm view-order-btn" data-order-id="${order.id}">
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
        <button class="btn btn-secondary btn-sm order-page-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>&#8249; ${t('common.previous') || 'Previous'}</button>
        <span style="font-size: 14px; color: var(--text-secondary);">${t('common.page') || 'Page'} ${page} ${t('common.of') || 'of'} ${totalPages}</span>
        <button class="btn btn-secondary btn-sm order-page-btn" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>${t('common.next') || 'Next'} &#8250;</button>
      </div>
      ` : ''}
    `;

    container.querySelectorAll('.pay-now-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        router.navigate(`/buyer/order-checkout?id=${btn.dataset.orderId}`);
      });
    });

    container.querySelectorAll('.view-order-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        router.navigate(`/order/detail?id=${btn.dataset.orderId}`);
      });
    });

    container.querySelectorAll('.order-page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.dataset.page);
        renderActiveOrdersTable(lastFiltered, currentPage);
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

      <!-- Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('orders.totalOrders')}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">${allOrders.length}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('orders.draftOrders')}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">${draftOrders.length}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('orders.activeOrders')}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">${activeOrders.length}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('orders.totalAmount')}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">$${totalSpent.toFixed(2)}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('orders.amountPaid')}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">$${totalDeposit.toFixed(2)}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('invoices.remainingBalance')}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">$${totalRemaining.toFixed(2)}</p>
        </div>
      </div>

      <!-- Draft Orders Section -->
      ${draftOrders.length > 0 ? `
      <div style="margin-bottom: 48px;">
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0;">${t('orders.draftOrders')}</h2>
          <span style="margin-left: 12px; background: var(--warning-color); color: white; padding: 4px 12px; border-radius: 12px; font-size: 14px;">${draftOrders.length}</span>
        </div>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">${t('orders.draftOrdersDescription')}</p>
        <div class="draft-orders-list-container"></div>
      </div>
      ` : ''}

      <!-- Active Orders Section -->
      <div>
        <h2 style="margin-bottom: 24px;">${t('orders.activeOrders')}</h2>

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

        <div class="orders-list-container"></div>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  if (window.lucide) window.lucide.createIcons();

  if (draftOrders.length > 0) {
    renderDraftOrdersTable(draftOrders);
  }
  renderActiveOrdersTable(activeOrders, 1);

  const applyFilters = () => {
    const orderNumber = (document.getElementById('filterOrderNumber')?.value || '').toLowerCase();
    const dateFrom = document.getElementById('filterDateFrom')?.value || '';
    const dateTo = document.getElementById('filterDateTo')?.value || '';

    let filtered = activeOrders;

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
    renderActiveOrdersTable(filtered, 1);
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
      lastFiltered = activeOrders;
      currentPage = 1;
      renderActiveOrdersTable(activeOrders, 1);
    });
  }
}
