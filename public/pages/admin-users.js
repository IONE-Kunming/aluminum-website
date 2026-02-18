import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import languageManager from '../js/language.js';
import { escapeHtml } from '../js/utils.js';

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
}

let allUsers = [];

async function loadUsers() {
  try {
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
    const editBtn = document.getElementById(`edit-user-${user.id}`);
    const deleteBtn = document.getElementById(`delete-user-${user.id}`);
    const toggleBtn = document.getElementById(`toggle-user-${user.id}`);
    
    if (editBtn) {
      editBtn.addEventListener('click', () => editUser(user));
    }
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => deleteUser(user));
    }
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => toggleUserStatus(user));
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
        <button class="btn-icon" id="edit-user-${user.id}" title="Edit User">
          <i data-lucide="edit"></i>
        </button>
        <button class="btn-icon" id="toggle-user-${user.id}" title="${isActive ? 'Deactivate' : 'Activate'} User">
          <i data-lucide="${isActive ? 'user-x' : 'user-check'}"></i>
        </button>
        <button class="btn-icon btn-danger" id="delete-user-${user.id}" title="Delete User">
          <i data-lucide="trash-2"></i>
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

async function editUser(user) {
  const t = languageManager.t.bind(languageManager);
  // TODO: Implement edit user modal
  window.toast.info(t('admin.editUserComingSoon'));
}

async function deleteUser(user) {
  if (!confirm(`Are you sure you want to delete user ${user.displayName || user.email}?`)) {
    return;
  }
  
  const t = languageManager.t.bind(languageManager);
  try {
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
