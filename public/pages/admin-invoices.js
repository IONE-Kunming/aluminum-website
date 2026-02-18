import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import languageManager from '../js/language.js';
import { escapeHtml, formatDate } from '../js/utils.js';

export async function renderAdminInvoices() {
  const t = languageManager.t.bind(languageManager);
  
  // Check if user is admin
  const profile = authManager.getUserProfile();
  if (profile?.role !== 'admin') {
    renderPageWithLayout('<div class="error">Access denied. Admin privileges required.</div>', 'admin');
    return;
  }
  
  const content = `
    <div class="admin-invoices-page">
      <div class="page-header">
        <h1><i data-lucide="file-text"></i> ${t('nav.invoices')} Management</h1>
        <p>Manage all invoices on the platform</p>
      </div>
      
      <div class="admin-controls">
        <div class="search-box">
          <i data-lucide="search"></i>
          <input type="text" id="invoice-search" placeholder="Search invoices by number or buyer..." />
        </div>
        <div class="filter-controls">
          <select id="status-filter">
            <option value="">All Status</option>
            <option value="issued">Issued</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>
      
      <div id="invoices-loading" class="loading-spinner">
        <i data-lucide="loader"></i> Loading invoices...
      </div>
      
      <div id="invoices-container" style="display: none;">
        <!-- Invoices table will be rendered here -->
      </div>
    </div>
  `;
  
  renderPageWithLayout(content, 'admin');
  if (window.lucide) window.lucide.createIcons();
  
  // Load and display invoices
  await loadInvoices();
  
  // Setup event listeners
  document.getElementById('invoice-search').addEventListener('input', filterInvoices);
  document.getElementById('status-filter').addEventListener('change', filterInvoices);
}

let allInvoices = [];

async function loadInvoices() {
  try {
    const invoicesSnapshot = await dataService.db.collection('invoices').get();
    allInvoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    displayInvoices(allInvoices);
  } catch (error) {
    console.error('Error loading invoices:', error);
    document.getElementById('invoices-loading').innerHTML = '<div class="error">Failed to load invoices</div>';
  }
}

function displayInvoices(invoices) {
  const container = document.getElementById('invoices-container');
  const loading = document.getElementById('invoices-loading');
  
  loading.style.display = 'none';
  container.style.display = 'block';
  
  if (invoices.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="file-text"></i>
        <p>No invoices found</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  
  container.innerHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Buyer</th>
            <th>Seller</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${invoices.map(invoice => renderInvoiceRow(invoice)).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  if (window.lucide) window.lucide.createIcons();
  
  // Setup action buttons
  invoices.forEach(invoice => {
    const viewBtn = document.getElementById(`view-invoice-${invoice.id}`);
    const deleteBtn = document.getElementById(`delete-invoice-${invoice.id}`);
    
    if (viewBtn) {
      viewBtn.addEventListener('click', () => viewInvoice(invoice));
    }
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => deleteInvoice(invoice));
    }
  });
}

function renderInvoiceRow(invoice) {
  const statusClass = `status-${invoice.status || 'issued'}`;
  
  return `
    <tr>
      <td><span class="invoice-number">${escapeHtml(invoice.invoiceNumber || 'N/A')}</span></td>
      <td>${escapeHtml(invoice.buyerName || invoice.buyerEmail || 'N/A')}</td>
      <td>${escapeHtml(invoice.sellerCompany || 'N/A')}</td>
      <td>$${(invoice.total || 0).toFixed(2)}</td>
      <td><span class="status-badge ${statusClass}">${escapeHtml(invoice.status || 'issued')}</span></td>
      <td>${formatDate(invoice.createdAt)}</td>
      <td class="actions">
        <button class="btn-icon" id="view-invoice-${invoice.id}" title="View Invoice">
          <i data-lucide="eye"></i>
        </button>
        <button class="btn-icon btn-danger" id="delete-invoice-${invoice.id}" title="Delete Invoice">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    </tr>
  `;
}

function filterInvoices() {
  const searchTerm = document.getElementById('invoice-search').value.toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;
  
  let filtered = allInvoices;
  
  // Search filter
  if (searchTerm) {
    filtered = filtered.filter(invoice => 
      (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(searchTerm)) ||
      (invoice.buyerName && invoice.buyerName.toLowerCase().includes(searchTerm)) ||
      (invoice.buyerEmail && invoice.buyerEmail.toLowerCase().includes(searchTerm))
    );
  }
  
  // Status filter
  if (statusFilter) {
    filtered = filtered.filter(invoice => invoice.status === statusFilter);
  }
  
  displayInvoices(filtered);
}

function viewInvoice(invoice) {
  window.router.navigate(`/buyer/invoice-detail?id=${invoice.id}`);
}

async function deleteInvoice(invoice) {
  if (!confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
    return;
  }
  
  try {
    await dataService.db.collection('invoices').doc(invoice.id).delete();
    window.toast.success('Invoice deleted successfully');
    await loadInvoices();
  } catch (error) {
    console.error('Error deleting invoice:', error);
    window.toast.error('Failed to delete invoice');
  }
}
