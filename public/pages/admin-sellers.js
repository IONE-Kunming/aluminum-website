import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import languageManager from '../js/language.js';
import { escapeHtml, showConfirm } from '../js/utils.js';

export async function renderAdminSellers() {
  const t = languageManager.t.bind(languageManager);
  
  // Check if user is admin
  const profile = authManager.getUserProfile();
  if (profile?.role !== 'admin') {
    renderPageWithLayout('<div class="error">Access denied. Admin privileges required.</div>', 'admin');
    return;
  }
  
  const content = `
    <div class="admin-sellers-page">
      <div class="page-header">
        <h1><i data-lucide="store"></i> ${t('nav.sellers')} Management</h1>
        <p>Manage all sellers on the platform</p>
      </div>
      
      <div class="admin-controls">
        <div class="search-box">
          <i data-lucide="search"></i>
          <input type="text" id="seller-search" placeholder="Search sellers by name or company..." />
        </div>
        <div class="filter-controls">
          <select id="status-filter">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      
      <div id="sellers-loading" class="loading-spinner">
        <i data-lucide="loader"></i> Loading sellers...
      </div>
      
      <div id="sellers-container" style="display: none;">
        <!-- Sellers table will be rendered here -->
      </div>
    </div>
  `;
  
  renderPageWithLayout(content, 'admin');
  if (window.lucide) window.lucide.createIcons();
  
  // Load and display sellers
  await loadSellers();
  
  // Setup event listeners
  document.getElementById('seller-search').addEventListener('input', filterSellers);
  document.getElementById('status-filter').addEventListener('change', filterSellers);
}

let allSellers = [];
let sellerStats = {};

async function loadSellers() {
  try {
    await dataService.init(); // Initialize dataService before accessing db
    // Load sellers
    const sellersSnapshot = await dataService.db.collection('users').where('role', '==', 'seller').get();
    allSellers = sellersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Load products count for each seller
    const productsSnapshot = await dataService.db.collection('products').get();
    sellerStats = {};
    productsSnapshot.docs.forEach(doc => {
      const product = doc.data();
      if (!sellerStats[product.sellerId]) {
        sellerStats[product.sellerId] = { products: 0, orders: 0 };
      }
      sellerStats[product.sellerId].products++;
    });
    
    // Load orders count for each seller
    const ordersSnapshot = await dataService.db.collection('orders').get();
    ordersSnapshot.docs.forEach(doc => {
      const order = doc.data();
      if (sellerStats[order.sellerId]) {
        sellerStats[order.sellerId].orders++;
      } else {
        sellerStats[order.sellerId] = { products: 0, orders: 1 };
      }
    });
    
    displaySellers(allSellers);
  } catch (error) {
    console.error('Error loading sellers:', error);
    document.getElementById('sellers-loading').innerHTML = '<div class="error">Failed to load sellers</div>';
  }
}

function displaySellers(sellers) {
  const container = document.getElementById('sellers-container');
  const loading = document.getElementById('sellers-loading');
  
  loading.style.display = 'none';
  container.style.display = 'block';
  
  if (sellers.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="store"></i>
        <p>No sellers found</p>
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
            <th>Company Name</th>
            <th>Contact Person</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Products</th>
            <th>Orders</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${sellers.map(seller => renderSellerRow(seller)).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  if (window.lucide) window.lucide.createIcons();
  
  // Setup action buttons
  sellers.forEach(seller => {
    const viewBtn = document.getElementById(`view-seller-${seller.id}`);
    const toggleBtn = document.getElementById(`toggle-seller-${seller.id}`);
    const deleteBtn = document.getElementById(`delete-seller-${seller.id}`);
    
    if (viewBtn) {
      viewBtn.addEventListener('click', () => viewSeller(seller));
    }
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => toggleSellerStatus(seller));
    }
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => deleteSeller(seller));
    }
  });
}

function renderSellerRow(seller) {
  const isActive = seller.isActive !== false;
  const statusClass = isActive ? 'status-active' : 'status-inactive';
  const statusText = isActive ? 'Active' : 'Inactive';
  const stats = sellerStats[seller.id] || { products: 0, orders: 0 };
  
  return `
    <tr>
      <td><strong>${escapeHtml(seller.companyName || 'N/A')}</strong></td>
      <td>${escapeHtml(seller.displayName || 'N/A')}</td>
      <td>${escapeHtml(seller.email || 'N/A')}</td>
      <td>${escapeHtml(seller.phoneNumber || 'N/A')}</td>
      <td>${stats.products}</td>
      <td>${stats.orders}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td class="actions">
        <button class="btn-icon" id="view-seller-${seller.id}" title="View Seller">
          <i data-lucide="eye"></i>
        </button>
        <button class="btn-icon" id="toggle-seller-${seller.id}" title="${isActive ? 'Deactivate' : 'Activate'} Seller">
          <i data-lucide="${isActive ? 'user-x' : 'user-check'}"></i>
        </button>
        <button class="btn-icon btn-danger" id="delete-seller-${seller.id}" title="Delete Seller">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    </tr>
  `;
}

function filterSellers() {
  const searchTerm = document.getElementById('seller-search').value.toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;
  
  let filtered = allSellers;
  
  // Search filter
  if (searchTerm) {
    filtered = filtered.filter(seller => 
      (seller.companyName && seller.companyName.toLowerCase().includes(searchTerm)) ||
      (seller.displayName && seller.displayName.toLowerCase().includes(searchTerm)) ||
      (seller.email && seller.email.toLowerCase().includes(searchTerm))
    );
  }
  
  // Status filter
  if (statusFilter) {
    const isActive = statusFilter === 'active';
    filtered = filtered.filter(seller => (seller.isActive !== false) === isActive);
  }
  
  displaySellers(filtered);
}

function viewSeller(seller) {
  // Sellers don't have a detail page, so view their products in admin products page with filter
  window.router.navigate(`/admin/products?sellerId=${seller.id}`);
}

async function toggleSellerStatus(seller) {
  const newStatus = !(seller.isActive !== false);
  const t = languageManager.t.bind(languageManager);
  const action = newStatus ? 'activate' : 'deactivate';
  if (!await showConfirm(`Are you sure you want to ${action} seller "${seller.companyName || seller.displayName}"?`)) {
    return;
  }
  try {
    await dataService.db.collection('users').doc(seller.id).update({
      isActive: newStatus
    });
    window.toast.success(t(newStatus ? 'admin.sellerActivated' : 'admin.sellerDeactivated'));
    await loadSellers();
  } catch (error) {
    console.error('Error updating seller status:', error);
    window.toast.error(t('admin.sellerStatusUpdateFailed'));
  }
}

async function deleteSeller(seller) {
  if (!await showConfirm(`Are you sure you want to delete seller "${seller.companyName || seller.displayName}"?`)) {
    return;
  }
  
  const t = languageManager.t.bind(languageManager);
  try {
    await dataService.db.collection('users').doc(seller.id).delete();
    window.toast.success(t('admin.sellerDeleted'));
    await loadSellers();
  } catch (error) {
    console.error('Error deleting seller:', error);
    window.toast.error(t('admin.sellerDeleteFailed'));
  }
}
