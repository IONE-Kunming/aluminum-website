import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import languageManager from '../js/language.js';
import { escapeHtml, showConfirm } from '../js/utils.js';

export async function renderAdminUsers() {
  const t = languageManager.t.bind(languageManager);
  
  // Check if user is admin
  const profile = authManager.getUserProfile();
  if (profile?.role !== 'admin') {
    renderPageWithLayout('<div class="error">Access denied. Admin privileges required.</div>', 'admin');
    return;
  }
  
  const content = `
    <div class="admin-users-page">
      <div class="page-header">
        <h1><i data-lucide="users"></i> ${t('admin.usersManagement')}</h1>
        <p>${t('admin.manageAllUsers')}</p>
      </div>
      
      <div class="admin-controls">
        <div class="search-box">
          <i data-lucide="search"></i>
          <input type="text" id="user-search" placeholder="${t('admin.searchUsersPlaceholder')}" />
        </div>
        <div class="filter-controls">
          <select id="role-filter">
            <option value="">${t('admin.allRoles')}</option>
            <option value="buyer">${t('admin.buyers')}</option>
            <option value="seller">${t('admin.sellers')}</option>
            <option value="admin">${t('admin.admins')}</option>
          </select>
          <select id="status-filter">
            <option value="">${t('admin.allStatus')}</option>
            <option value="active">${t('admin.active')}</option>
            <option value="inactive">${t('admin.inactive')}</option>
          </select>
          <button class="btn btn-secondary" id="import-profile-btn">
            <i data-lucide="upload"></i> ${t('admin.importProfile')}
          </button>
          <button class="btn btn-primary" id="export-all-users-btn">
            <i data-lucide="download"></i> ${t('admin.exportAllUsers')}
          </button>
        </div>
      </div>
      
      <div id="users-loading" class="loading-spinner">
        <i data-lucide="loader"></i> ${t('admin.loadingUsers')}
      </div>
      
      <div id="users-container" style="display: none;">
        <!-- Users table will be rendered here -->
      </div>
    </div>
  `;
  
  renderPageWithLayout(content, 'admin');
  if (window.lucide) window.lucide.createIcons();
  
  // Load and display users
  await loadUsers();
  
  // Setup event listeners
  document.getElementById('user-search').addEventListener('input', filterUsers);
  document.getElementById('role-filter').addEventListener('change', filterUsers);
  document.getElementById('status-filter').addEventListener('change', filterUsers);
  document.getElementById('import-profile-btn').addEventListener('click', importUserProfile);
  document.getElementById('export-all-users-btn').addEventListener('click', exportAllUsers);
}

let allUsers = [];

async function loadUsers() {
  try {
    await dataService.init(); // Initialize dataService before accessing db
    const usersSnapshot = await dataService.db.collection('users').get();
    allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    displayUsers(allUsers);
  } catch (error) {
    console.error('Error loading users:', error);
    document.getElementById('users-loading').innerHTML = '<div class="error">Failed to load users</div>';
  }
}

function displayUsers(users) {
  const t = languageManager.t.bind(languageManager);
  const container = document.getElementById('users-container');
  const loading = document.getElementById('users-loading');
  
  loading.style.display = 'none';
  container.style.display = 'block';
  
  if (users.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="users"></i>
        <p>${t('admin.noUsersFound')}</p>
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
            <th>${t('common.name')}</th>
            <th>${t('common.email')}</th>
            <th>Role</th>
            <th>Company</th>
            <th>${t('admin.status')}</th>
            <th>${t('admin.createdColumn')}</th>
            <th>${t('finances.actions')}</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(user => renderUserRow(user)).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  if (window.lucide) window.lucide.createIcons();
  
  // Setup action buttons
  users.forEach(user => {
    const viewBtn = document.getElementById(`view-user-${user.id}`);
    const editBtn = document.getElementById(`edit-user-${user.id}`);
    const deleteBtn = document.getElementById(`delete-user-${user.id}`);
    const toggleBtn = document.getElementById(`toggle-user-${user.id}`);
    const exportBtn = document.getElementById(`export-user-${user.id}`);
    
    if (viewBtn) {
      viewBtn.addEventListener('click', () => viewUserDetails(user));
    }
    if (editBtn) {
      editBtn.addEventListener('click', () => editUser(user));
    }
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => deleteUser(user));
    }
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => toggleUserStatus(user));
    }
    if (exportBtn) {
      exportBtn.addEventListener('click', () => exportUserProfile(user));
    }
  });
}

function renderUserRow(user) {
  const t = languageManager.t.bind(languageManager);
  const isActive = user.isActive !== false;
  const statusClass = isActive ? 'status-active' : 'status-inactive';
  const statusText = isActive ? t('admin.active') : t('admin.inactive');
  
  return `
    <tr>
      <td>${escapeHtml(user.displayName || 'N/A')}</td>
      <td>${escapeHtml(user.email || 'N/A')}</td>
      <td><span class="badge badge-${user.role || 'buyer'}">${escapeHtml(user.role || 'buyer')}</span></td>
      <td>${escapeHtml(user.companyName || 'N/A')}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>${new Date(user.createdAt).toLocaleDateString()}</td>
      <td class="actions">
        <button class="btn-icon" id="view-user-${user.id}" title="${t('admin.viewDetails')}">
          <i data-lucide="eye"></i>
        </button>
        <button class="btn-icon" id="edit-user-${user.id}" title="${t('admin.editUser')}">
          <i data-lucide="edit"></i>
        </button>
        <button class="btn-icon" id="toggle-user-${user.id}" title="${isActive ? t('admin.deactivateUser') : t('admin.activateUser')}">
          <i data-lucide="${isActive ? 'user-x' : 'user-check'}"></i>
        </button>
        <button class="btn-icon btn-danger" id="delete-user-${user.id}" title="${t('admin.deleteUser')}">
          <i data-lucide="trash-2"></i>
        </button>
        <button class="btn-icon" id="export-user-${user.id}" title="${t('admin.exportProfile')}">
          <i data-lucide="download"></i>
        </button>
      </td>
    </tr>
  `;
}

function filterUsers() {
  const searchTerm = document.getElementById('user-search').value.toLowerCase();
  const roleFilter = document.getElementById('role-filter').value;
  const statusFilter = document.getElementById('status-filter').value;
  
  let filtered = allUsers;
  
  // Search filter
  if (searchTerm) {
    filtered = filtered.filter(user => 
      (user.displayName && user.displayName.toLowerCase().includes(searchTerm)) ||
      (user.email && user.email.toLowerCase().includes(searchTerm)) ||
      (user.companyName && user.companyName.toLowerCase().includes(searchTerm))
    );
  }
  
  // Role filter
  if (roleFilter) {
    filtered = filtered.filter(user => user.role === roleFilter);
  }
  
  // Status filter
  if (statusFilter) {
    const isActive = statusFilter === 'active';
    filtered = filtered.filter(user => (user.isActive !== false) === isActive);
  }
  
  displayUsers(filtered);
}

function viewUserDetails(user) {
  const t = languageManager.t.bind(languageManager);
  const isActive = user.isActive !== false;

  const formatVal = (v) => escapeHtml(v || 'N/A');
  const formatDate = (v) => {
    if (!v) return 'N/A';
    try { return new Date(v).toLocaleString(); } catch { return String(v); }
  };

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'view-user-modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 560px;">
      <div class="modal-header">
        <h2><i data-lucide="user"></i> ${t('admin.userDetails')}</h2>
        <button class="modal-close" id="close-view-user-modal"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 4px;">${t('admin.displayName')}</p>
            <p style="font-weight: 600; margin: 0 0 16px;">${formatVal(user.displayName)}</p>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 4px;">${t('common.email')}</p>
            <p style="font-weight: 600; margin: 0 0 16px;">${formatVal(user.email)}</p>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 4px;">Role</p>
            <p style="margin: 0 0 16px;"><span class="badge badge-${user.role || 'buyer'}">${formatVal(user.role)}</span></p>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 4px;">Status</p>
            <p style="margin: 0 0 16px;"><span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">${isActive ? t('admin.active') : t('admin.inactive')}</span></p>
          </div>
          <div>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 4px;">Company</p>
            <p style="font-weight: 600; margin: 0 0 16px;">${formatVal(user.companyName)}</p>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 4px;">${t('admin.phone')}</p>
            <p style="font-weight: 600; margin: 0 0 16px;">${formatVal(user.phoneNumber)}</p>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 4px;">${t('admin.userId')}</p>
            <p style="font-weight: 600; font-size: 12px; word-break: break-all; margin: 0 0 16px;">${formatVal(user.id)}</p>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 4px;">${t('admin.joined')}</p>
            <p style="font-weight: 600; margin: 0 0 16px;">${formatDate(user.createdAt)}</p>
          </div>
        </div>
        ${user.address ? `
        <hr style="border-color: var(--border-color); margin: 4px 0 16px;">
        <p style="font-size: 13px; font-weight: 600; margin: 0 0 8px;">${t('admin.address')}</p>
        <p style="font-size: 14px; margin: 0;">${formatVal(user.address.street)}, ${formatVal(user.address.city)}, ${formatVal(user.address.country)}</p>
        ` : ''}
        ${user.bio ? `
        <hr style="border-color: var(--border-color); margin: 16px 0 12px;">
        <p style="font-size: 13px; font-weight: 600; margin: 0 0 8px;">${t('admin.bio')}</p>
        <p style="font-size: 14px; margin: 0; color: var(--text-secondary);">${formatVal(user.bio)}</p>
        ` : ''}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="close-view-user-btn">${t('common.close')}</button>
        <button class="btn btn-primary" id="edit-from-view-btn">
          <i data-lucide="edit"></i> ${t('admin.editUser')}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();

  const closeModal = () => modal.remove();
  document.getElementById('close-view-user-modal').addEventListener('click', closeModal);
  document.getElementById('close-view-user-btn').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.getElementById('edit-from-view-btn').addEventListener('click', () => {
    closeModal();
    editUser(user);
  });
}

async function editUser(user) {
  const t = languageManager.t.bind(languageManager);
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2><i data-lucide="edit"></i> ${t('admin.editUser')}</h2>
        <button class="modal-close" id="close-edit-modal">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <form id="edit-user-form">
          <div class="form-group">
            <label for="edit-displayName">${t('profile.displayName')}</label>
            <input type="text" id="edit-displayName" value="${escapeHtml(user.displayName || '')}" required />
          </div>
          <div class="form-group">
            <label for="edit-email">${t('auth.email')}</label>
            <input type="email" id="edit-email" value="${escapeHtml(user.email || '')}" required />
            <small style="color: var(--text-secondary);">${t('admin.emailChangeWarning')}</small>
          </div>
          <div class="form-group">
            <label for="edit-role">${t('profile.role')}</label>
            <select id="edit-role" required>
              <option value="buyer" ${user.role === 'buyer' ? 'selected' : ''}>Buyer</option>
              <option value="seller" ${user.role === 'seller' ? 'selected' : ''}>Seller</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </div>
          <div class="form-group">
            <label for="edit-companyName">${t('auth.companyName')}</label>
            <input type="text" id="edit-companyName" value="${escapeHtml(user.companyName || '')}" />
          </div>
          <div class="form-group">
            <label for="edit-phoneNumber">${t('profile.phone')}</label>
            <input type="text" id="edit-phoneNumber" value="${escapeHtml(user.phoneNumber || '')}" />
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="edit-isActive" ${user.isActive !== false ? 'checked' : ''} />
              ${t('admin.activeStatus')}
            </label>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="cancel-edit-user">${t('common.cancel')}</button>
        <button class="btn btn-primary" id="save-edit-user">${t('common.save')}</button>
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
  document.getElementById('cancel-edit-user').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  // Save button handler
  document.getElementById('save-edit-user').addEventListener('click', async () => {
    const newEmail = document.getElementById('edit-email').value.trim();
    const oldEmail = user.email;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      window.toast.error(t('admin.invalidEmail'));
      return;
    }
    
    const updatedData = {
      displayName: document.getElementById('edit-displayName').value,
      email: newEmail,
      role: document.getElementById('edit-role').value,
      companyName: document.getElementById('edit-companyName').value,
      phoneNumber: document.getElementById('edit-phoneNumber').value,
      isActive: document.getElementById('edit-isActive').checked
    };

    if (!await showConfirm(`Are you sure you want to save changes for ${user.displayName || user.email}?`)) {
      return;
    }
    
    try {
      // Check if email changed and if it's already in use
      if (newEmail !== oldEmail) {
        // Check if new email already exists
        const usersSnapshot = await dataService.db.collection('users')
          .where('email', '==', newEmail)
          .get();
        
        if (!usersSnapshot.empty && usersSnapshot.docs[0].id !== user.id) {
          window.toast.error(t('admin.emailAlreadyInUse'));
          return;
        }
        
        // Show warning about email change
        if (!await showConfirm(t('admin.confirmEmailChange', { email: newEmail }))) {
          return;
        }
      }
      
      await dataService.db.collection('users').doc(user.id).update(updatedData);
      window.toast.success(t('admin.userUpdated'));
      
      // If email changed, show additional info
      if (newEmail !== oldEmail) {
        window.toast.info(t('admin.emailChangeNotice'));
      }
      
      closeModal();
      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      window.toast.error(t('admin.userUpdateFailed'));
    }
  });
}

async function deleteUser(user) {
  const t = languageManager.t.bind(languageManager);

  // Count related data to show in confirmation
  let productCount = 0, orderCount = 0, invoiceCount = 0;
  try {
    const [productsSnap, ordersBuyerSnap, ordersSellerSnap, invoicesBuyerSnap, invoicesSellerSnap] = await Promise.all([
      dataService.db.collection('products').where('sellerId', '==', user.id).get(),
      dataService.db.collection('orders').where('buyerId', '==', user.id).get(),
      dataService.db.collection('orders').where('sellerId', '==', user.id).get(),
      dataService.db.collection('invoices').where('buyerId', '==', user.id).get(),
      dataService.db.collection('invoices').where('sellerId', '==', user.id).get()
    ]);
    productCount = productsSnap.size;
    orderCount = ordersBuyerSnap.size + ordersSellerSnap.size;
    invoiceCount = invoicesBuyerSnap.size + invoicesSellerSnap.size;
  } catch (e) {
    console.error('Error counting related data:', e);
  }

  const userName = user.displayName || user.email;
  const details = [
    `${t('admin.userProfileFor')} "${userName}"`,
    productCount > 0 ? `${productCount} ${t('admin.products')}` : null,
    orderCount > 0 ? `${orderCount} ${t('admin.orders')}` : null,
    invoiceCount > 0 ? `${invoiceCount} ${t('admin.invoicesCount')}` : null
  ].filter(Boolean).join('\n• ');

  if (!await showConfirm(`${t('admin.confirmDeleteData')}\n\n• ${details}\n\n${t('admin.cannotBeUndone')}`)) {
    return;
  }

  try {
    // Delete related products
    const productsSnap = await dataService.db.collection('products').where('sellerId', '==', user.id).get();
    const productDeletes = productsSnap.docs.map(doc => doc.ref.delete());

    // Delete related orders (buyer or seller)
    const ordersBuyerSnap = await dataService.db.collection('orders').where('buyerId', '==', user.id).get();
    const ordersSellerSnap = await dataService.db.collection('orders').where('sellerId', '==', user.id).get();
    const orderDeletes = [
      ...ordersBuyerSnap.docs.map(doc => doc.ref.delete()),
      ...ordersSellerSnap.docs.map(doc => doc.ref.delete())
    ];

    // Delete related invoices (buyer or seller)
    const invoicesBuyerSnap = await dataService.db.collection('invoices').where('buyerId', '==', user.id).get();
    const invoicesSellerSnap = await dataService.db.collection('invoices').where('sellerId', '==', user.id).get();
    const invoiceDeletes = [
      ...invoicesBuyerSnap.docs.map(doc => doc.ref.delete()),
      ...invoicesSellerSnap.docs.map(doc => doc.ref.delete())
    ];

    // Delete related conversations
    const convoSnap = await dataService.db.collection('conversations').where('participants', 'array-contains', user.id).get();
    const convoDeletes = convoSnap.docs.map(doc => doc.ref.delete());

    await Promise.all([...productDeletes, ...orderDeletes, ...invoiceDeletes, ...convoDeletes]);

    // Delete the user document
    await dataService.db.collection('users').doc(user.id).delete();
    window.toast.success(t('admin.userDeleted'));
    await loadUsers();
  } catch (error) {
    console.error('Error deleting user:', error);
    window.toast.error(t('admin.userDeleteFailed'));
  }
}

async function toggleUserStatus(user) {
  const newStatus = !(user.isActive !== false);
  const t = languageManager.t.bind(languageManager);
  const action = newStatus ? 'activate' : 'deactivate';
  if (!await showConfirm(`Are you sure you want to ${action} user "${user.displayName || user.email}"?`)) {
    return;
  }
  try {
    await dataService.db.collection('users').doc(user.id).update({
      isActive: newStatus
    });
    window.toast.success(t(newStatus ? 'admin.userActivated' : 'admin.userDeactivated'));
    await loadUsers();
  } catch (error) {
    console.error('Error updating user status:', error);
    window.toast.error(t('admin.userStatusUpdateFailed'));
  }
}

async function exportUserProfile(user) {
  const t = languageManager.t.bind(languageManager);
  try {
    window.toast.info(t('admin.exportingProfile') || 'Exporting profile...');
    await dataService.init();

    // Fetch products, orders, and invoices in parallel
    const [productsSnap, ordersAsBuyerSnap, ordersAsSellerSnap, invoicesAsBuyerSnap, invoicesAsSellerSnap] = await Promise.all([
      dataService.db.collection('products').where('sellerId', '==', user.id).get(),
      dataService.db.collection('orders').where('buyerId', '==', user.id).get(),
      dataService.db.collection('orders').where('sellerId', '==', user.id).get(),
      dataService.db.collection('invoices').where('buyerId', '==', user.id).get(),
      dataService.db.collection('invoices').where('sellerId', '==', user.id).get(),
    ]);

    // Map products with explicit detail fields
    const products = productsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        modelNumber: data.modelNumber || '',
        description: data.description || '',
        price: data.price || 0,
        stock: data.stock || data.stockQuantity || 0,
        category: data.category || '',
        mainCategory: data.mainCategory || '',
        primaryImage: data.imageUrl || '',
        images: data.images || [],
        specifications: data.specifications || null,
        weight: data.weight || null,
        dimensions: data.dimensions || null,
        material: data.material || null,
        color: data.color || null,
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || '',
        isActive: data.isActive !== false,
        ...data,
      };
    });

    // Collect all product image URLs into a flat list
    const allProductImages = [];
    products.forEach(p => {
      const imageSet = new Set();
      if (p.primaryImage) {
        imageSet.add(p.primaryImage);
        allProductImages.push({ productId: p.id, productName: p.name || p.modelNumber, url: p.primaryImage, type: 'primary' });
      }
      if (p.images && p.images.length > 0) {
        p.images.forEach((img, idx) => {
          if (!imageSet.has(img)) {
            imageSet.add(img);
            allProductImages.push({ productId: p.id, productName: p.name || p.modelNumber, url: img, type: 'additional' });
          }
        });
      }
    });

    // De-duplicate orders and invoices
    const orderIds = new Set();
    const orders = [];
    [...ordersAsBuyerSnap.docs, ...ordersAsSellerSnap.docs].forEach(doc => {
      if (!orderIds.has(doc.id)) {
        orderIds.add(doc.id);
        const data = doc.data();
        orders.push({
          id: doc.id,
          status: data.status || '',
          total: data.total || 0,
          deposit: data.deposit || 0,
          remainingBalance: data.remainingBalance || 0,
          paymentMethod: data.paymentMethod || '',
          paymentStatus: data.paymentStatus || '',
          items: data.items || [],
          buyerId: data.buyerId || '',
          sellerId: data.sellerId || '',
          createdAt: data.createdAt || '',
          updatedAt: data.updatedAt || '',
          ...data,
        });
      }
    });

    const invoiceIds = new Set();
    const invoices = [];
    [...invoicesAsBuyerSnap.docs, ...invoicesAsSellerSnap.docs].forEach(doc => {
      if (!invoiceIds.has(doc.id)) {
        invoiceIds.add(doc.id);
        const data = doc.data();
        invoices.push({
          id: doc.id,
          invoiceNumber: data.invoiceNumber || '',
          status: data.status || '',
          total: data.total || 0,
          subtotal: data.subtotal || 0,
          tax: data.tax || 0,
          items: data.items || [],
          buyerId: data.buyerId || '',
          sellerId: data.sellerId || '',
          dueDate: data.dueDate || '',
          paidAt: data.paidAt || '',
          createdAt: data.createdAt || '',
          ...data,
        });
      }
    });

    // Compute financial summary
    const totalSellerRevenue = ordersAsSellerSnap.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);
    const totalBuyerSpending = ordersAsBuyerSnap.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);
    const totalDepositsReceived = ordersAsSellerSnap.docs.reduce((sum, doc) => sum + (doc.data().deposit || 0), 0);
    const totalDepositsPaid = ordersAsBuyerSnap.docs.reduce((sum, doc) => sum + (doc.data().deposit || 0), 0);
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid');
    const totalInvoicedAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalPaidAmount = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalUnpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Build comprehensive export object
    const exportData = {
      profile: {
        id: user.id,
        displayName: user.displayName || '',
        email: user.email || '',
        role: user.role || '',
        companyName: user.companyName || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || null,
        bio: user.bio || '',
        photoURL: user.photoURL || '',
        isActive: user.isActive !== false,
        createdAt: user.createdAt || '',
        language: user.language || user.preferredLanguage || '',
        paymentMethods: user.paymentMethods || [],
        ...user,
      },
      products: products,
      productImages: allProductImages,
      financials: {
        orders: orders,
        invoices: invoices,
        summary: {
          totalProducts: products.length,
          totalOrders: orders.length,
          totalInvoices: invoices.length,
          totalSellerRevenue: totalSellerRevenue,
          totalBuyerSpending: totalBuyerSpending,
          totalDepositsReceived: totalDepositsReceived,
          totalDepositsPaid: totalDepositsPaid,
          totalInvoicedAmount: totalInvoicedAmount,
          totalPaidInvoiceAmount: totalPaidAmount,
          totalUnpaidInvoiceAmount: totalUnpaidAmount,
          paidInvoicesCount: paidInvoices.length,
          unpaidInvoicesCount: unpaidInvoices.length,
        }
      },
      exportedAt: new Date().toISOString()
    };

    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-profile-${user.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.toast.success(t('admin.profileExported'));
  } catch (error) {
    console.error('Error exporting profile:', error);
    window.toast.error(t('admin.profileExportFailed') || 'Failed to export profile');
  }
}

async function exportAllUsers() {
  const t = languageManager.t.bind(languageManager);
  try {
    window.toast.info(t('admin.exportingAllUsers') || 'Exporting all users...');
    await dataService.init();

    const usersSnapshot = await dataService.db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const allExports = [];
    for (const user of users) {
      const [productsSnap, ordersAsBuyerSnap, ordersAsSellerSnap, invoicesAsBuyerSnap, invoicesAsSellerSnap] = await Promise.all([
        dataService.db.collection('products').where('sellerId', '==', user.id).get(),
        dataService.db.collection('orders').where('buyerId', '==', user.id).get(),
        dataService.db.collection('orders').where('sellerId', '==', user.id).get(),
        dataService.db.collection('invoices').where('buyerId', '==', user.id).get(),
        dataService.db.collection('invoices').where('sellerId', '==', user.id).get(),
      ]);

      const products = productsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          modelNumber: data.modelNumber || '',
          description: data.description || '',
          price: data.price || 0,
          stock: data.stock || data.stockQuantity || 0,
          category: data.category || '',
          mainCategory: data.mainCategory || '',
          primaryImage: data.imageUrl || '',
          images: data.images || [],
          specifications: data.specifications || null,
          weight: data.weight || null,
          dimensions: data.dimensions || null,
          material: data.material || null,
          color: data.color || null,
          createdAt: data.createdAt || '',
          updatedAt: data.updatedAt || '',
          isActive: data.isActive !== false,
          ...data,
        };
      });

      const allProductImages = [];
      products.forEach(p => {
        const imageSet = new Set();
        if (p.primaryImage) {
          imageSet.add(p.primaryImage);
          allProductImages.push({ productId: p.id, productName: p.name || p.modelNumber, url: p.primaryImage, type: 'primary' });
        }
        if (p.images && p.images.length > 0) {
          p.images.forEach((img) => {
            if (!imageSet.has(img)) {
              imageSet.add(img);
              allProductImages.push({ productId: p.id, productName: p.name || p.modelNumber, url: img, type: 'additional' });
            }
          });
        }
      });

      const orderIds = new Set();
      const orders = [];
      [...ordersAsBuyerSnap.docs, ...ordersAsSellerSnap.docs].forEach(doc => {
        if (!orderIds.has(doc.id)) {
          orderIds.add(doc.id);
          const data = doc.data();
          orders.push({
            id: doc.id,
            status: data.status || '',
            total: data.total || 0,
            deposit: data.deposit || 0,
            remainingBalance: data.remainingBalance || 0,
            paymentMethod: data.paymentMethod || '',
            paymentStatus: data.paymentStatus || '',
            items: data.items || [],
            buyerId: data.buyerId || '',
            sellerId: data.sellerId || '',
            createdAt: data.createdAt || '',
            updatedAt: data.updatedAt || '',
            ...data,
          });
        }
      });

      const invoiceIds = new Set();
      const invoices = [];
      [...invoicesAsBuyerSnap.docs, ...invoicesAsSellerSnap.docs].forEach(doc => {
        if (!invoiceIds.has(doc.id)) {
          invoiceIds.add(doc.id);
          const data = doc.data();
          invoices.push({
            id: doc.id,
            invoiceNumber: data.invoiceNumber || '',
            status: data.status || '',
            total: data.total || 0,
            subtotal: data.subtotal || 0,
            tax: data.tax || 0,
            items: data.items || [],
            buyerId: data.buyerId || '',
            sellerId: data.sellerId || '',
            dueDate: data.dueDate || '',
            paidAt: data.paidAt || '',
            createdAt: data.createdAt || '',
            ...data,
          });
        }
      });

      const totalSellerRevenue = ordersAsSellerSnap.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);
      const totalBuyerSpending = ordersAsBuyerSnap.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);
      const totalDepositsReceived = ordersAsSellerSnap.docs.reduce((sum, doc) => sum + (doc.data().deposit || 0), 0);
      const totalDepositsPaid = ordersAsBuyerSnap.docs.reduce((sum, doc) => sum + (doc.data().deposit || 0), 0);
      const paidInvoices = invoices.filter(inv => inv.status === 'paid');
      const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid');
      const totalInvoicedAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const totalPaidAmount = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const totalUnpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

      allExports.push({
        profile: {
          id: user.id,
          displayName: user.displayName || '',
          email: user.email || '',
          role: user.role || '',
          companyName: user.companyName || '',
          phoneNumber: user.phoneNumber || '',
          address: user.address || null,
          bio: user.bio || '',
          photoURL: user.photoURL || '',
          isActive: user.isActive !== false,
          createdAt: user.createdAt || '',
          language: user.language || user.preferredLanguage || '',
          paymentMethods: user.paymentMethods || [],
          ...user,
        },
        products: products,
        productImages: allProductImages,
        financials: {
          orders: orders,
          invoices: invoices,
          summary: {
            totalProducts: products.length,
            totalOrders: orders.length,
            totalInvoices: invoices.length,
            totalSellerRevenue: totalSellerRevenue,
            totalBuyerSpending: totalBuyerSpending,
            totalDepositsReceived: totalDepositsReceived,
            totalDepositsPaid: totalDepositsPaid,
            totalInvoicedAmount: totalInvoicedAmount,
            totalPaidInvoiceAmount: totalPaidAmount,
            totalUnpaidInvoiceAmount: totalUnpaidAmount,
            paidInvoicesCount: paidInvoices.length,
            unpaidInvoicesCount: unpaidInvoices.length,
          }
        },
      });
    }

    const exportData = {
      users: allExports,
      totalUsers: allExports.length,
      exportedAt: new Date().toISOString(),
    };

    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-users-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.toast.success(t('admin.allUsersExported'));
  } catch (error) {
    console.error('Error exporting all users:', error);
    window.toast.error(t('admin.allUsersExportFailed') || 'Failed to export all users');
  }
}

function importUserProfile() {
  const t = languageManager.t.bind(languageManager);
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.style.display = 'none';
  document.body.appendChild(input);

  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    document.body.removeChild(input);
    if (!file) return;

    let profileData;
    try {
      const text = await file.text();
      profileData = JSON.parse(text);
    } catch (err) {
      window.toast.error(t('admin.invalidJsonFile'));
      return;
    }

    // Show modal with option to pick existing or create new user
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 540px;">
        <div class="modal-header">
          <h2><i data-lucide="upload"></i> ${t('admin.importProfileData')}</h2>
          <button class="modal-close" id="close-import-modal"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body">
          <p style="margin: 0 0 12px; color: var(--text-secondary);">
            ${t('admin.importedFields')} ${escapeHtml(Object.keys(profileData).slice(0, 20).join(', '))}${Object.keys(profileData).length > 20 ? '...' : ''}
          </p>

          <!-- Import mode toggle -->
          <div class="form-group" style="margin-bottom: 16px;">
            <label style="font-weight: 600; margin-bottom: 8px; display: block;">${t('admin.importTo')}</label>
            <div style="display: flex; gap: 12px;">
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="radio" name="import-mode" value="existing" checked />
                ${t('admin.existingUser')}
              </label>
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="radio" name="import-mode" value="new" />
                ${t('admin.newUser')}
              </label>
            </div>
          </div>

          <!-- Existing user section -->
          <div id="import-existing-section">
            <div class="form-group">
              <label for="import-target-select">${t('admin.selectUserFromList')}</label>
              <select id="import-target-select" class="form-control">
                <option value="">${t('admin.chooseAUser')}</option>
                ${allUsers.map(u => `<option value="${escapeHtml(u.id)}">${escapeHtml((u.displayName || 'No name') + ' (' + (u.email || u.id) + ')')}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- New user section (hidden initially) -->
          <div id="import-new-section" style="display: none;">
            <div class="form-group">
              <label for="import-new-email">${t('admin.emailRequiredForAccount')}</label>
              <input type="email" id="import-new-email" class="form-control" value="${escapeHtml(profileData.email || '')}" placeholder="user@example.com" />
            </div>
            <div class="form-group">
              <label for="import-new-password">${t('admin.passwordMin6')}</label>
              <input type="password" id="import-new-password" class="form-control" placeholder="${t('admin.enterPasswordPlaceholder')}" />
            </div>
            <small style="color: var(--text-secondary); display: block; margin-top: -8px;">
              ${t('admin.newAccountDescription')}
            </small>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancel-import-btn">${t('common.cancel')}</button>
          <button class="btn btn-primary" id="apply-import-btn">
            <i data-lucide="check"></i> ${t('admin.applyImport')}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();

    const closeModal = () => modal.remove();
    document.getElementById('close-import-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-import-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', (ev) => { if (ev.target === modal) closeModal(); });

    // Toggle between existing and new user sections
    modal.querySelectorAll('input[name="import-mode"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const isNew = radio.value === 'new' && radio.checked;
        document.getElementById('import-existing-section').style.display = isNew ? 'none' : 'block';
        document.getElementById('import-new-section').style.display = isNew ? 'block' : 'none';
      });
    });

    document.getElementById('apply-import-btn').addEventListener('click', async () => {
      const mode = modal.querySelector('input[name="import-mode"]:checked').value;

      // Only allow safe profile fields to be imported
      const allowedFields = [
        'displayName', 'email', 'companyName', 'phoneNumber', 'bio',
        'address', 'role', 'isActive', 'photoURL', 'language',
        'preferredLanguage', 'paymentMethods'
      ];
      const { id, ...rawData } = profileData;
      const updateData = {};
      for (const key of allowedFields) {
        if (key in rawData) updateData[key] = rawData[key];
      }

      if (mode === 'existing') {
        // --- Import to existing user ---
        const targetId = document.getElementById('import-target-select').value;
        if (!targetId) {
          window.toast.error(t('admin.pleaseSelectUser'));
          return;
        }

        const targetUser = allUsers.find(u => u.id === targetId);
        const targetLabel = targetUser ? (targetUser.displayName || targetUser.email) : targetId;

        if (Object.keys(updateData).length === 0) {
          window.toast.error(t('admin.noValidFields'));
          return;
        }

        if (!await showConfirm(`Apply imported profile data to "${escapeHtml(targetLabel)}"?`)) {
          return;
        }

        try {
          await dataService.db.collection('users').doc(targetId).set(updateData, { merge: true });
          window.toast.success(t('admin.profileImported'));
          closeModal();
          await loadUsers();
        } catch (error) {
          console.error('Error importing profile:', error);
          window.toast.error(t('admin.failedToImportProfile'));
        }
      } else {
        // --- Create new user and import data ---
        const newEmail = document.getElementById('import-new-email').value.trim();
        const newPassword = document.getElementById('import-new-password').value;

        if (!newEmail) {
          window.toast.error(t('admin.emailRequiredForNewAccount'));
          return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
          window.toast.error(t('admin.pleaseEnterValidEmail'));
          return;
        }
        if (!newPassword || newPassword.length < 6) {
          window.toast.error(t('admin.passwordMin6Error'));
          return;
        }

        if (!await showConfirm(`Create a new account for "${escapeHtml(newEmail)}" and apply imported profile data?`)) {
          return;
        }

        const applyBtn = document.getElementById('apply-import-btn');
        applyBtn.disabled = true;
        applyBtn.innerHTML = '<i data-lucide="loader"></i> ' + t('admin.creating');
        if (window.lucide) window.lucide.createIcons();

        try {
          // Use a secondary Firebase app to create the user without signing out the admin
          const { firebaseConfig } = await import('../js/config.js');
          const secondaryApp = firebase.initializeApp(firebaseConfig, 'importUserApp');
          const secondaryAuth = secondaryApp.auth();

          // Connect to emulator if in dev mode
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            try { secondaryAuth.useEmulator('http://localhost:9099'); } catch (_) { /* ignore */ }
          }

          const credential = await secondaryAuth.createUserWithEmailAndPassword(newEmail, newPassword);
          const newUid = credential.user.uid;

          // Sign out from secondary app immediately
          await secondaryAuth.signOut();
          await secondaryApp.delete();

          // Ensure the email is set in profile data
          updateData.email = newEmail;
          if (!updateData.createdAt) {
            updateData.createdAt = new Date().toISOString();
          }
          if (!updateData.isActive) {
            updateData.isActive = true;
          }

          // Create the Firestore profile document with the new UID
          await dataService.db.collection('users').doc(newUid).set(updateData);
          window.toast.success(t('admin.newAccountCreated', { email: escapeHtml(newEmail) }));
          closeModal();
          await loadUsers();
        } catch (error) {
          console.error('Error creating new user:', error);
          // Clean up secondary app if it still exists
          try {
            const existingApp = firebase.app('importUserApp');
            await existingApp.delete();
          } catch (_) { /* already deleted */ }

          if (error.code === 'auth/email-already-in-use') {
            window.toast.error(t('admin.emailAlreadyExists'));
          } else {
            window.toast.error(t('admin.failedToCreateAccount') + ': ' + (error.message || 'Unknown error'));
          }
        } finally {
          applyBtn.disabled = false;
          applyBtn.innerHTML = '<i data-lucide="check"></i> ' + t('admin.applyImport');
          if (window.lucide) window.lucide.createIcons();
        }
      }
    });
  });

  input.click();
}
