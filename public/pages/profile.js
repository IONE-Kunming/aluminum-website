import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';

export function renderProfile() {
  const profile = authManager.getUserProfile();
  const user = authManager.getCurrentUser();
  
  const content = `
    <div class="profile-page">
      <div class="page-header">
        <h1>Profile Settings</h1>
        <p>Manage your account information</p>
      </div>

      <div class="profile-card card">
        <div class="profile-avatar">
          ${profile?.displayName?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div class="profile-info">
          <h2>${profile?.displayName || 'User'}</h2>
          <p>${user?.email || ''}</p>
          <span class="profile-role">${profile?.role || 'guest'}</span>
        </div>
      </div>

      <div class="profile-section card">
        <h3>Account Information</h3>
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" class="form-control" value="${profile?.displayName || ''}" readonly>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" class="form-control" value="${user?.email || ''}" readonly>
        </div>
        <div class="form-group">
          <label>Company</label>
          <input type="text" class="form-control" value="${profile?.companyName || 'N/A'}" readonly>
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="text" class="form-control" value="${profile?.phoneNumber || 'N/A'}" readonly>
        </div>
      </div>
    </div>
  `;

  renderPageWithLayout(content, profile?.role);
  if (window.lucide) window.lucide.createIcons();
}
