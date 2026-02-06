import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import { escapeHtml } from '../js/utils.js';
import languageManager from '../js/language.js';

export function renderProfile() {
  const profile = authManager.getUserProfile();
  const user = authManager.getCurrentUser();
  const t = languageManager.t.bind(languageManager);
  
  const content = `
    <div class="profile-page">
      <div class="page-header">
        <h1>${t('profile.profileSettings')}</h1>
        <p>${t('profile.manageAccountInfo')}</p>
      </div>

      <div class="profile-card card">
        <div class="profile-avatar">
          ${(profile?.displayName ? escapeHtml(profile.displayName).charAt(0).toUpperCase() : 'U')}
        </div>
        <div class="profile-info">
          <h2>${escapeHtml(profile?.displayName || 'User')}</h2>
          <p>${escapeHtml(user?.email || '')}</p>
          <span class="profile-role">${escapeHtml(profile?.role || 'guest')}</span>
        </div>
      </div>

      <div class="profile-section card">
        <h3>${t('profile.accountInformation')}</h3>
        <div class="form-group">
          <label>${t('profile.displayName')}</label>
          <input type="text" class="form-control" value="${escapeHtml(profile?.displayName || '')}" readonly>
        </div>
        <div class="form-group">
          <label>${t('profile.email')}</label>
          <input type="email" class="form-control" value="${escapeHtml(user?.email || '')}" readonly>
        </div>
        <div class="form-group">
          <label>Company</label>
          <input type="text" class="form-control" value="${escapeHtml(profile?.companyName || 'N/A')}" readonly>
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="text" class="form-control" value="${escapeHtml(profile?.phoneNumber || 'N/A')}" readonly>
        </div>
      </div>
    </div>
  `;

  renderPageWithLayout(content, profile?.role);
  if (window.lucide) window.lucide.createIcons();
}
