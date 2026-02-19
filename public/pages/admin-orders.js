import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import languageManager from '../js/language.js';
import { escapeHtml, formatDate, showConfirm } from '../js/utils.js';

export async function renderAdminOrders() {
  const t = languageManager.t.bind(languageManager);
  
  // Check if user is admin
  const profile = authManager.getUserProfile();
  if (profile?.role !== 'admin') {
    renderPageWithLayout('<div class="error">Access denied. Admin privileges required.</div>', 'admin');
    return;
  }
  
  const content = `
    <div class="admin-orders-page">
      <div class="page-header">
        <h1><i data-lucide="shopping-bag"></i> ${t('nav.orders')} Management</h1>
        <p>Manage all orders on the platform</p>
      </div>
      
      <div class="admin-controls">
        <div class="search-box">
          <i data-lucide="search"></i>
          <input type="text" id="order-search" placeholder="Search orders by ID or buyer..." />
        </div>
        <div class="filter-controls">
          <select id="status-filter">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      
      <div id="orders-loading" class="loading-spinner">
        <i data-lucide="loader"></i> Loading orders...
      </div>
      
      <div id="orders-container" style="display: none;">
        <!-- Orders table will be rendered here -->
      </div>
    </div>
  `;
  
  renderPageWithLayout(content, 'admin');
  if (window.lucide) window.lucide.createIcons();
  
  // Load and display orders
  await loadOrders();
  
  // Setup event listeners
  document.getElementById('order-search').addEventListener('input', filterOrders);
  document.getElementById('status-filter').addEventListener('change', filterOrders);
}

let allOrders = [];

async function loadOrders() {
  try {
    await dataService.init(); // Initialize dataService before accessing db
    const ordersSnapshot = await dataService.db.collection('orders').get();
    allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    displayOrders(allOrders);
  } catch (error) {
    console.error('Error loading orders:', error);
    document.getElementById('orders-loading').innerHTML = '<div class="error">Failed to load orders</div>';
  }
}

function displayOrders(orders) {
  const container = document.getElementById('orders-container');
  const loading = document.getElementById('orders-loading');
  
  loading.style.display = 'none';
  container.style.display = 'block';
  
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="shopping-bag"></i>
        <p>No orders found</p>
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
            <th>Order ID</th>
            <th>Buyer</th>
            <th>Seller</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(order => renderOrderRow(order)).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  if (window.lucide) window.lucide.createIcons();
  
  // Setup action buttons
  orders.forEach(order => {
    const editBtn = document.getElementById(`edit-order-${order.id}`);
    const viewBtn = document.getElementById(`view-order-${order.id}`);
    const deleteBtn = document.getElementById(`delete-order-${order.id}`);
    
    if (editBtn) {
      editBtn.addEventListener('click', () => editOrder(order));
    }
    if (viewBtn) {
      viewBtn.addEventListener('click', () => viewOrder(order));
    }
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => deleteOrder(order));
    }
  });
}

function renderOrderRow(order) {
  const statusClass = `status-${order.status || 'pending'}`;
  
  return `
    <tr>
      <td><span class="order-id">${escapeHtml(order.id.substring(0, 8))}...</span></td>
      <td>${escapeHtml(order.buyerName || order.buyerEmail || 'N/A')}</td>
      <td>${escapeHtml(order.sellerName || order.sellerCompany || 'N/A')}</td>
      <td>${order.items?.length || 0} items</td>
      <td>$${(order.total || 0).toFixed(2)}</td>
      <td><span class="status-badge ${statusClass}">${escapeHtml(order.status || 'pending')}</span></td>
      <td>${formatDate(order.createdAt)}</td>
      <td class="actions">
        <button class="btn-icon" id="edit-order-${order.id}" title="Edit Order">
          <i data-lucide="edit"></i>
        </button>
        <button class="btn-icon" id="view-order-${order.id}" title="View Order">
          <i data-lucide="eye"></i>
        </button>
        <button class="btn-icon btn-danger" id="delete-order-${order.id}" title="Delete Order">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    </tr>
  `;
}

function filterOrders() {
  const searchTerm = document.getElementById('order-search').value.toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;
  
  let filtered = allOrders;
  
  // Search filter
  if (searchTerm) {
    filtered = filtered.filter(order => 
      (order.id && order.id.toLowerCase().includes(searchTerm)) ||
      (order.buyerName && order.buyerName.toLowerCase().includes(searchTerm)) ||
      (order.buyerEmail && order.buyerEmail.toLowerCase().includes(searchTerm))
    );
  }
  
  // Status filter
  if (statusFilter) {
    filtered = filtered.filter(order => order.status === statusFilter);
  }
  
  displayOrders(filtered);
}

async function editOrder(order) {
  const t = languageManager.t.bind(languageManager);
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2><i data-lucide="edit"></i> ${t('admin.editOrder')}</h2>
        <button class="modal-close" id="close-edit-modal">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <form id="edit-order-form">
          <div class="form-group">
            <label for="edit-order-id">${t('order.orderId')}</label>
            <input type="text" id="edit-order-id" value="${escapeHtml(order.id)}" disabled style="opacity: 0.6; cursor: not-allowed;" />
          </div>
          <div class="form-group">
            <label for="edit-order-status">${t('order.status')}</label>
            <select id="edit-order-status" required>
              <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
              <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
              <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
              <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
          <div class="form-group">
            <label for="edit-order-notes">${t('order.notes')}</label>
            <textarea id="edit-order-notes" rows="3">${escapeHtml(order.notes || '')}</textarea>
          </div>
          <div class="form-group">
            <label>${t('order.orderDetails')}</label>
            <div style="padding: 12px; background: var(--background-secondary); border-radius: 8px;">
              <p><strong>${t('order.buyer')}:</strong> ${escapeHtml(order.buyerName || order.buyerEmail || 'N/A')}</p>
              <p><strong>${t('order.seller')}:</strong> ${escapeHtml(order.sellerName || order.sellerCompany || 'N/A')}</p>
              <p><strong>${t('checkout.items')}:</strong> ${order.items?.length || 0} ${t('common.items')}</p>
              <p><strong>${t('order.total')}:</strong> $${(order.total || 0).toFixed(2)}</p>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancel-edit-order">${t('common.cancel')}</button>
        <button class="btn btn-primary" id="save-edit-order">${t('common.save')}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();
  
  // Modal event listeners
  const closeModal = () => {
    modal.remove();
  };
  
  document.getElementById('close-edit-modal').addEventListener('click', closeModal);
  document.getElementById('cancel-edit-order').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  // Save button handler
  document.getElementById('save-edit-order').addEventListener('click', async () => {
    const updatedData = {
      status: document.getElementById('edit-order-status').value,
      notes: document.getElementById('edit-order-notes').value
    };

    const shortId = order.id ? order.id.substring(0, 8).toUpperCase() : order.id;
    if (!await showConfirm(`Are you sure you want to save changes for order #${shortId}?`)) {
      return;
    }
    
    try {
      await dataService.db.collection('orders').doc(order.id).update(updatedData);
      window.toast.success(t('admin.orderUpdated'));
      closeModal();
      await loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      window.toast.error(t('admin.orderUpdateFailed'));
    }
  });
}

function viewOrder(order) {
  window.router.navigate(`/order/detail?id=${order.id}`);
}

async function deleteOrder(order) {
  const shortId = order.id ? order.id.substring(0, 8).toUpperCase() : order.id;
  if (!await showConfirm(`Are you sure you want to delete order #${shortId}?`)) {
    return;
  }
  
  const t = languageManager.t.bind(languageManager);
  try {
    await dataService.db.collection('orders').doc(order.id).delete();
    window.toast.success(t('admin.orderDeleted'));
    await loadOrders();
  } catch (error) {
    console.error('Error deleting order:', error);
    window.toast.error(t('admin.orderDeleteFailed'));
  }
}
