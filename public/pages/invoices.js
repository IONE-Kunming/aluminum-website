import { renderPageWithLayout } from '../js/layout.js';
import languageManager from '../js/language.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml, formatDate } from '../js/utils.js';
import router from '../js/router.js';

export async function renderInvoices() {
  const t = languageManager.t.bind(languageManager);
  
  // Get current user
  const user = authManager.getCurrentUser();
  if (!user) {
    const content = `
      <div class="invoices-page">
        <div class="page-header">
          <h1>${t('invoices.title') || 'Invoices'}</h1>
          <p>${t('invoices.subtitle') || 'View and download your invoices'}</p>
        </div>
        <div class="empty-state">
          <i data-lucide="alert-circle" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>${t('auth.notAuthenticated')}</h2>
          <p>${t('auth.pleaseLoginToViewInvoices')}</p>
        </div>
      </div>
    `;
    renderPageWithLayout(content, 'buyer');
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  
  // Fetch all invoices for this buyer (already sorted descending by dataService)
  console.log('Fetching invoices for buyer:', user.uid);
  const allInvoices = await dataService.getInvoices({ buyerId: user.uid });
  console.log('Buyer invoices fetched:', allInvoices.length);

  const PAGE_SIZE = 10;
  let currentPage = 1;
  let lastFiltered = allInvoices;

  const renderInvoicesList = (invoices, page = 1) => {
    const invoicesList = document.querySelector('.invoices-list-container');
    if (!invoicesList) return;

    const totalPages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE));
    page = Math.min(Math.max(1, page), totalPages);
    const start = (page - 1) * PAGE_SIZE;
    const pageInvoices = invoices.slice(start, start + PAGE_SIZE);

    if (invoices.length === 0) {
      invoicesList.innerHTML = `
        <div class="empty-state">
          <i data-lucide="file-text" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>${t('invoices.noInvoices')}</h2>
          <p>${t('invoices.invoicesWillAppear')}</p>
        </div>
      `;
    } else {
      invoicesList.innerHTML = `
        <div class="invoices-table-wrapper" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
                <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px;">${t('invoices.invoiceNumber')}</th>
                <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px;">${t('orders.date') || 'Date'}</th>
                <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px;">${t('invoices.seller') || 'Seller'}</th>
                <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px; text-align: right;">${t('invoices.depositPaid') || 'Amount Paid'}</th>
                <th style="padding: 10px 12px; font-weight: 600; color: var(--text-secondary); font-size: 13px; text-align: right;">${t('invoices.remainingBalance') || 'Remaining'}</th>
                <th style="padding: 10px 12px;"></th>
              </tr>
            </thead>
            <tbody>
              ${pageInvoices.map(invoice => `
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 12px; font-weight: 600; font-size: 14px;">${escapeHtml(invoice.invoiceNumber)}</td>
                  <td style="padding: 12px; color: var(--text-secondary); font-size: 13px;">${formatDate(invoice.createdAt)}</td>
                  <td style="padding: 12px; font-size: 14px;">${escapeHtml(invoice.sellerCompany || invoice.sellerName || 'N/A')}</td>
                  <td style="padding: 12px; text-align: right; font-size: 14px; color: var(--success-color);">$${(invoice.depositPaid || 0).toFixed(2)}</td>
                  <td style="padding: 12px; text-align: right; font-size: 14px; color: var(--warning-color);">$${(invoice.remainingBalance || 0).toFixed(2)}</td>
                  <td style="padding: 12px; text-align: right;">
                    <button class="btn btn-secondary btn-sm view-invoice-btn" data-invoice-id="${invoice.id}">
                      ${t('invoices.viewDetails') || 'View Details'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${totalPages > 1 ? `
        <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 20px; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-sm invoice-page-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>&#8249; ${t('common.previous') || 'Previous'}</button>
          <span style="font-size: 14px; color: var(--text-secondary);">${t('common.page') || 'Page'} ${page} ${t('common.of') || 'of'} ${totalPages}</span>
          <button class="btn btn-secondary btn-sm invoice-page-btn" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>${t('common.next') || 'Next'} &#8250;</button>
        </div>
        ` : ''}
      `;

      document.querySelectorAll('.view-invoice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const invoiceId = btn.dataset.invoiceId;
          router.navigate(`/buyer/invoice?id=${invoiceId}`);
        });
      });

      document.querySelectorAll('.invoice-page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const newPage = parseInt(btn.dataset.page);
          currentPage = newPage;
          renderInvoicesList(lastFiltered, currentPage);
        });
      });
    }

    if (window.lucide) window.lucide.createIcons();
  };
  
  const content = `
    <div class="invoices-page">
      <div class="page-header">
        <h1>${t('invoices.title') || 'Invoices'}</h1>
        <p>${t('invoices.subtitle') || 'View and download your invoices'}</p>
      </div>

      <!-- Accounting Summary -->
      <div class="accounting-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('invoices.totalInvoices') || 'Total Invoices'}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">${allInvoices.length}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('invoices.totalAmount') || 'Total Amount'}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">$${allInvoices.reduce((s, inv) => s + (inv.total || 0), 0).toFixed(2)}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('invoices.amountPaid') || 'Amount Paid'}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">$${allInvoices.reduce((s, inv) => s + (inv.depositPaid || 0), 0).toFixed(2)}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">${t('invoices.outstandingBalance') || 'Outstanding Balance'}</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">$${allInvoices.reduce((s, inv) => s + (inv.remainingBalance || 0), 0).toFixed(2)}</p>
        </div>
      </div>
      
      <!-- Filter Section -->
      <div class="filter-section card" style="margin-bottom: 24px;">
        <div class="filter-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0;">${t('invoices.filterInvoices')}</h3>
          <button class="btn btn-text btn-sm" id="resetFilters">
            <i data-lucide="x"></i>
            ${t('common.reset')}
          </button>
        </div>
        <div class="filter-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div class="form-group">
            <label>${t('invoices.invoiceNumber')}</label>
            <input type="text" id="filterInvoiceNumber" class="form-control" placeholder="${t('common.search')}...">
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

      <div class="invoices-list-container">
        <!-- Invoices will be rendered here -->
      </div>
    </div>
  `;
  
  renderPageWithLayout(content, 'buyer');
  if (window.lucide) window.lucide.createIcons();
  
  // Initial render
  renderInvoicesList(allInvoices, 1);
  
  // Filter function
  const applyFilters = () => {
    const invoiceNumber = document.getElementById('filterInvoiceNumber')?.value.toLowerCase() || '';
    const dateFrom = document.getElementById('filterDateFrom')?.value || '';
    const dateTo = document.getElementById('filterDateTo')?.value || '';
    
    let filtered = allInvoices;
    
    // Filter by invoice number
    if (invoiceNumber) {
      filtered = filtered.filter(inv => 
        (inv.invoiceNumber || '').toLowerCase().includes(invoiceNumber)
      );
    }
    
    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(inv => {
        const invDate = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt);
        return invDate >= fromDate;
      });
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(inv => {
        const invDate = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt);
        return invDate <= toDate;
      });
    }
    
    lastFiltered = filtered;
    currentPage = 1;
    renderInvoicesList(filtered, currentPage);
  };
  
  // Add event listeners for filters
  ['filterInvoiceNumber', 'filterDateFrom', 'filterDateTo'].forEach(id => {
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
      ['filterInvoiceNumber', 'filterDateFrom', 'filterDateTo'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
      });
      lastFiltered = allInvoices;
      currentPage = 1;
      renderInvoicesList(allInvoices, currentPage);
    });
  }
}
