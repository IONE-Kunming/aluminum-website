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
        <form id="profile-form">
          <div class="form-group">
            <label>${t('profile.displayName')}</label>
            <input type="text" class="form-control" id="displayName" value="${escapeHtml(profile?.displayName || '')}" readonly>
            <small style="color: #6b7280; font-size: 12px;">Display name cannot be changed</small>
          </div>
          <div class="form-group">
            <label>${t('profile.email')}</label>
            <input type="email" class="form-control" id="email" value="${escapeHtml(user?.email || '')}" required>
            <small style="color: #6b7280; font-size: 12px;">Enter your new email address</small>
          </div>
          <div class="form-group">
            <label>Company</label>
            <input type="text" class="form-control" id="company" value="${escapeHtml(profile?.companyName || 'N/A')}" readonly>
            <small style="color: #6b7280; font-size: 12px;">Company name cannot be changed</small>
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input type="tel" class="form-control" id="phoneNumber" value="${escapeHtml(profile?.phoneNumber || '')}" placeholder="+1234567890">
            <small style="color: #6b7280; font-size: 12px;">Enter your phone number with country code</small>
          </div>
          <div class="form-group">
            <label>${t('profile.role')}</label>
            <input type="text" class="form-control" id="role" value="${escapeHtml(profile?.role || 'guest')}" readonly>
            <small style="color: #6b7280; font-size: 12px;">Role cannot be changed</small>
          </div>
          <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button type="submit" class="btn btn-primary" id="save-profile-btn">
              <i data-lucide="save"></i>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  renderPageWithLayout(content, profile?.role);
  if (window.lucide) window.lucide.createIcons();
  
  // Initialize profile form handlers
  initProfileHandlers(profile, user);
}

function initProfileHandlers(profile, user) {
  const form = document.getElementById('profile-form');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phoneNumber');
  const saveBtn = document.getElementById('save-profile-btn');
  
  if (!form) return;
  
  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newEmail = emailInput?.value.trim();
    const newPhone = phoneInput?.value.trim();
    
    // Check if anything changed
    const emailChanged = newEmail !== user?.email;
    const phoneChanged = newPhone !== (profile?.phoneNumber || '');
    
    if (!emailChanged && !phoneChanged) {
      if (window.toast) {
        window.toast.info('No changes to save');
      }
      return;
    }
    
    // Validate email
    if (newEmail && !isValidEmail(newEmail)) {
      if (window.toast) {
        window.toast.error('Please enter a valid email address');
      }
      return;
    }
    
    try {
      // Disable form while updating
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i data-lucide="loader"></i> Saving...';
      if (window.lucide) window.lucide.createIcons();
      
      const updates = {};
      if (emailChanged) updates.email = newEmail;
      if (phoneChanged) updates.phoneNumber = newPhone;
      
      const result = await authManager.updateProfileFields(updates);
      
      if (result.success) {
        if (window.toast) {
          window.toast.success('Profile updated successfully');
        }
        
        // If email was changed, inform user they might need to verify
        if (emailChanged) {
          if (window.toast) {
            window.toast.info('Please check your new email for verification');
          }
        }
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (window.toast) {
        window.toast.error('Failed to update profile: ' + error.message);
      }
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i data-lucide="save"></i> Save Changes';
      if (window.lucide) window.lucide.createIcons();
    }
  });
}

function isValidEmail(email) {
  // More robust email validation that checks for common issues
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Additional checks
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  
  const [localPart, domain] = parts;
  
  // Check for valid local part
  if (localPart.length === 0 || localPart.length > 64) return false;
  
  // Check for valid domain
  if (domain.length === 0 || domain.length > 255) return false;
  if (domain.startsWith('.') || domain.endsWith('.')) return false;
  if (domain.includes('..')) return false;
  
  return true;
}
