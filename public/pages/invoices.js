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
  
  // Fetch all invoices for this buyer
  console.log('Fetching invoices for buyer:', user.uid);
  const allInvoices = await dataService.getInvoices({ buyerId: user.uid });
  console.log('Buyer invoices fetched:', allInvoices.length);
  
  const renderInvoicesList = (invoices) => {
    const invoicesList = document.querySelector('.invoices-list-container');
    if (!invoicesList) return;
    
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
        <div class="invoices-list">
          ${invoices.map(invoice => `
            <div class="invoice-card card" style="cursor: pointer;" data-invoice-id="${invoice.id}">
              <div class="invoice-header">
                <div class="invoice-info">
                  <h3>${escapeHtml(invoice.invoiceNumber)}</h3>
                  <span class="invoice-date">${formatDate(invoice.createdAt)}</span>
                </div>
                <div class="invoice-status">
                  <span class="status-badge status-${invoice.status}">${invoice.status}</span>
                </div>
              </div>
              
              <div class="invoice-details">
                <p><strong>${t('invoices.seller')}:</strong> ${escapeHtml(invoice.sellerCompany || invoice.sellerName || 'N/A')}</p>
                <p><strong>${t('invoices.items')}:</strong> ${invoice.items?.length || 0}</p>
              </div>
              
              <div class="invoice-summary">
                <div class="invoice-summary-row">
                  <span>${t('invoices.total')}:</span>
                  <span class="invoice-total">$${invoice.total?.toFixed(2) || '0.00'}</span>
                </div>
                <div class="invoice-summary-row">
                  <span>${t('invoices.depositPaid')}:</span>
                  <span class="text-success">$${invoice.depositPaid?.toFixed(2) || '0.00'}</span>
                </div>
                <div class="invoice-summary-row">
                  <span>${t('invoices.remainingBalance')}:</span>
                  <span class="text-warning">$${invoice.remainingBalance?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              
              <div class="invoice-actions">
                <button class="btn btn-secondary btn-sm view-invoice-btn" data-invoice-id="${invoice.id}">
                  <i data-lucide="eye"></i>
                  ${t('invoices.viewDetails')}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      
      // Re-attach event listeners
      document.querySelectorAll('.view-invoice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const invoiceId = btn.dataset.invoiceId;
          router.navigate(`/buyer/invoice?id=${invoiceId}`);
        });
      });
      
      document.querySelectorAll('.invoice-card').forEach(card => {
        card.addEventListener('click', () => {
          const invoiceId = card.dataset.invoiceId;
          router.navigate(`/buyer/invoice?id=${invoiceId}`);
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
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">Total Invoices</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">${allInvoices.length}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">Total Amount</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">$${allInvoices.reduce((s, inv) => s + (inv.total || 0), 0).toFixed(2)}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">Amount Paid</p>
          <p style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0;">$${allInvoices.reduce((s, inv) => s + (inv.depositPaid || 0), 0).toFixed(2)}</p>
        </div>
        <div class="summary-card card" style="padding: 20px; text-align: center;">
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; font-weight: 500;">Outstanding Balance</p>
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
  renderInvoicesList(allInvoices);
  
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
    
    renderInvoicesList(filtered);
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
      renderInvoicesList(allInvoices);
    });
  }
}

