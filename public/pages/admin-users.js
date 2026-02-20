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
        <h1><i data-lucide="users"></i> ${t('nav.users')} Management</h1>
        <p>Manage all platform users (buyers, sellers, and admins)</p>
      </div>
      
      <div class="admin-controls">
        <div class="search-box">
          <i data-lucide="search"></i>
          <input type="text" id="user-search" placeholder="Search users by name or email..." />
        </div>
        <div class="filter-controls">
          <select id="role-filter">
            <option value="">All Roles</option>
            <option value="buyer">Buyers</option>
            <option value="seller">Sellers</option>
            <option value="admin">Admins</option>
          </select>
          <select id="status-filter">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button class="btn btn-secondary" id="import-profile-btn">
            <i data-lucide="upload"></i> Import Profile
          </button>
        </div>
      </div>
      
      <div id="users-loading" class="loading-spinner">
        <i data-lucide="loader"></i> Loading users...
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
  const container = document.getElementById('users-container');
  const loading = document.getElementById('users-loading');
  
  loading.style.display = 'none';
  container.style.display = 'block';
  
  if (users.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="users"></i>
        <p>No users found</p>
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
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Company</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
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
  const isActive = user.isActive !== false;
  const statusClass = isActive ? 'status-active' : 'status-inactive';
  const statusText = isActive ? 'Active' : 'Inactive';
  
  return `
    <tr>
      <td>${escapeHtml(user.displayName || 'N/A')}</td>
      <td>${escapeHtml(user.email || 'N/A')}</td>
      <td><span class="badge badge-${user.role || 'buyer'}">${escapeHtml(user.role || 'buyer')}</span></td>
      <td>${escapeHtml(user.companyName || 'N/A')}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>${new Date(user.createdAt).toLocaleDateString()}</td>
      <td class="actions">
        <button class="btn-icon" id="view-user-${user.id}" title="View Details">
          <i data-lucide="eye"></i>
        </button>
        <button class="btn-icon" id="edit-user-${user.id}" title="Edit User">
          <i data-lucide="edit"></i>
        </button>
        <button class="btn-icon" id="toggle-user-${user.id}" title="${isActive ? 'Deactivate' : 'Activate'} User">
          <i data-lucide="${isActive ? 'user-x' : 'user-check'}"></i>
        </button>
        <button class="btn-icon btn-danger" id="delete-user-${user.id}" title="Delete User">
          <i data-lucide="trash-2"></i>
        </button>
        <button class="btn-icon" id="export-user-${user.id}" title="Export Profile">
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
        <h2><i data-lucide="user"></i> User Details</h2>
        <button class="modal-close" id="close-view-user-modal"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 4px;">Display Name</p>
            <p style="font-weight: 600; margin: 0 0 16px;">${formatVal(user.displayName)}</p>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 4px;">Email</p>
            <p style="font-weight: 600; margin: 0 0 16px;">${formatVal(user.email)}</p>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 4px;">Role</p>
            <p style="margin: 0 0 16px;"><span class="badge badge-${user.role || 'buyer'}">${formatVal(user.role)}</span></p>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 4px;">Status</p>
            <p style="margin: 0 0 16px;"><span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">${isActive ? 'Active' : 'Inactive'}</span></p>
          </div>
          <div>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 4px;">Company</p>
            <p style="font-weight: 600; margin: 0 0 16px;">${formatVal(user.companyName)}</p>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 4px;">Phone</p>
            <p style="font-weight: 600; margin: 0 0 16px;">${formatVal(user.phoneNumber)}</p>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 4px;">User ID</p>
            <p style="font-weight: 600; font-size: 12px; word-break: break-all; margin: 0 0 16px;">${formatVal(user.id)}</p>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 4px;">Joined</p>
            <p style="font-weight: 600; margin: 0 0 16px;">${formatDate(user.createdAt)}</p>
          </div>
        </div>
        ${user.address ? `
        <hr style="border-color: var(--border-color); margin: 4px 0 16px;">
        <p style="font-size: 13px; font-weight: 600; margin: 0 0 8px;">Address</p>
        <p style="font-size: 14px; margin: 0;">${formatVal(user.address.street)}, ${formatVal(user.address.city)}, ${formatVal(user.address.country)}</p>
        ` : ''}
        ${user.bio ? `
        <hr style="border-color: var(--border-color); margin: 16px 0 12px;">
        <p style="font-size: 13px; font-weight: 600; margin: 0 0 8px;">Bio</p>
        <p style="font-size: 14px; margin: 0; color: var(--text-secondary);">${formatVal(user.bio)}</p>
        ` : ''}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="close-view-user-btn">Close</button>
        <button class="btn btn-primary" id="edit-from-view-btn">
          <i data-lucide="edit"></i> Edit User
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
    `User profile for "${userName}"`,
    productCount > 0 ? `${productCount} product(s)` : null,
    orderCount > 0 ? `${orderCount} order(s)` : null,
    invoiceCount > 0 ? `${invoiceCount} invoice(s)` : null
  ].filter(Boolean).join('\n• ');

  if (!await showConfirm(`Are you sure you want to delete the following data?\n\n• ${details}\n\nThis action cannot be undone.`)) {
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

function exportUserProfile(user) {
  const data = JSON.stringify(user, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `user-profile-${user.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  window.toast.success('Profile exported successfully');
}

function importUserProfile() {
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
      window.toast.error('Invalid JSON file');
      return;
    }

    // Show modal to pick target user
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h2><i data-lucide="upload"></i> Import Profile Data</h2>
          <button class="modal-close" id="close-import-modal"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body">
          <p style="margin: 0 0 12px; color: var(--text-secondary);">
            Imported fields: ${escapeHtml(Object.keys(profileData).slice(0, 20).join(', '))}${Object.keys(profileData).length > 20 ? '...' : ''}
          </p>
          <div class="form-group">
            <label for="import-target-select">Select existing user</label>
            <select id="import-target-select">
              <option value="">-- Choose a user --</option>
              ${allUsers.map(u => `<option value="${escapeHtml(u.id)}">${escapeHtml(u.displayName || u.email || u.id)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="import-target-id">Or enter User ID manually</label>
            <input type="text" id="import-target-id" placeholder="Paste user ID here..." />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancel-import-btn">Cancel</button>
          <button class="btn btn-primary" id="apply-import-btn">
            <i data-lucide="check"></i> Apply Import
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

    document.getElementById('apply-import-btn').addEventListener('click', async () => {
      const selectedId = document.getElementById('import-target-select').value;
      const manualId = document.getElementById('import-target-id').value.trim();
      const targetId = selectedId || manualId;

      if (!targetId) {
        window.toast.error('Please select a user or enter a User ID');
        return;
      }

      // Only allow safe profile fields to be imported
      const allowedFields = [
        'displayName', 'email', 'companyName', 'phoneNumber', 'bio',
        'address', 'role', 'isActive', 'photoURL', 'language'
      ];
      const { id, ...rawData } = profileData;
      const updateData = {};
      for (const key of allowedFields) {
        if (key in rawData) updateData[key] = rawData[key];
      }

      if (Object.keys(updateData).length === 0) {
        window.toast.error('No valid profile fields found in the imported file');
        return;
      }

      if (!await showConfirm(`Apply imported profile data to user "${targetId}"?`)) {
        return;
      }

      try {
        await dataService.db.collection('users').doc(targetId).set(updateData, { merge: true });
        window.toast.success('Profile imported successfully');
        closeModal();
        await loadUsers();
      } catch (error) {
        console.error('Error importing profile:', error);
        window.toast.error('Failed to import profile');
      }
    });
  });

  input.click();
}
