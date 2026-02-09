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
            <input type="text" class="form-control" id="displayName" value="${escapeHtml(profile?.displayName || '')}" required>
            <small style="color: #6b7280; font-size: 12px;">Enter your display name</small>
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
            <input 
              type="tel" 
              class="form-control" 
              id="phoneNumber" 
              value="${escapeHtml(profile?.phoneNumber || '')}" 
              placeholder="+1234567890"
              inputmode="numeric"
              pattern="[0-9+\\-\\s()]+"
            >
            <small style="color: #6b7280; font-size: 12px;">Enter your phone number with country code (letters not allowed)</small>
          </div>
          <div class="form-group">
            <label>${t('profile.preferredLanguage')}</label>
            <select class="form-control" id="preferredLanguage">
              <option value="en" ${(profile?.preferredLanguage || 'en') === 'en' ? 'selected' : ''}>${t('languages.en')}</option>
              <option value="zh" ${(profile?.preferredLanguage || 'en') === 'zh' ? 'selected' : ''}>${t('languages.zh')}</option>
              <option value="ar" ${(profile?.preferredLanguage || 'en') === 'ar' ? 'selected' : ''}>${t('languages.ar')}</option>
              <option value="ur" ${(profile?.preferredLanguage || 'en') === 'ur' ? 'selected' : ''}>${t('languages.ur')}</option>
            </select>
            <small style="color: #6b7280; font-size: 12px;">${t('profile.languageDescription')}</small>
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
  const displayNameInput = document.getElementById('displayName');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phoneNumber');
  const preferredLanguageSelect = document.getElementById('preferredLanguage');
  const saveBtn = document.getElementById('save-profile-btn');
  
  if (!form) return;
  
  // Prevent non-numeric characters in phone number (except +, -, space, parentheses)
  phoneInput.addEventListener('input', (e) => {
    const cursorPosition = e.target.selectionStart;
    const oldValue = e.target.value;
    const newValue = oldValue.replace(/[^0-9+\-\s()]/g, '');
    
    if (oldValue !== newValue) {
      e.target.value = newValue;
      // Restore cursor position
      e.target.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
    }
  });
  
  // Prevent pasting non-numeric content
  phoneInput.addEventListener('paste', (e) => {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const cleanedText = pastedText.replace(/[^0-9+\-\s()]/g, '');
    
    // Insert cleaned text at cursor position
    const start = phoneInput.selectionStart;
    const end = phoneInput.selectionEnd;
    const currentValue = phoneInput.value;
    phoneInput.value = currentValue.substring(0, start) + cleanedText + currentValue.substring(end);
    phoneInput.selectionStart = phoneInput.selectionEnd = start + cleanedText.length;
  });
  
  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newDisplayName = displayNameInput?.value.trim();
    const newEmail = emailInput?.value.trim();
    const newPhone = phoneInput?.value.trim();
    const newPreferredLanguage = preferredLanguageSelect?.value;
    
    // Check if anything changed
    const displayNameChanged = newDisplayName !== (profile?.displayName || '');
    const emailChanged = newEmail !== user?.email;
    const phoneChanged = newPhone !== (profile?.phoneNumber || '');
    const languageChanged = newPreferredLanguage !== (profile?.preferredLanguage || 'en');
    
    if (!displayNameChanged && !emailChanged && !phoneChanged && !languageChanged) {
      if (window.toast) {
        window.toast.info('No changes to save');
      }
      return;
    }
    
    // Validate display name
    if (displayNameChanged && newDisplayName.length < 2) {
      if (window.toast) {
        window.toast.error('Display name must be at least 2 characters long');
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
    
    // Validate phone number format if changed
    if (phoneChanged && newPhone && !isValidPhoneNumber(newPhone)) {
      if (window.toast) {
        window.toast.error('Please enter a valid phone number with country code (e.g., +1234567890)');
      }
      return;
    }
    
    try {
      // Disable form while updating
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i data-lucide="loader"></i> Saving...';
      if (window.lucide) window.lucide.createIcons();
      
      const updates = {};
      if (displayNameChanged) updates.displayName = newDisplayName;
      if (emailChanged) updates.email = newEmail;
      if (phoneChanged) updates.phoneNumber = newPhone;
      if (languageChanged) updates.preferredLanguage = newPreferredLanguage;
      
      const result = await authManager.updateProfileFields(updates);
      
      if (result.success) {
        if (window.toast) {
          window.toast.success('Profile updated successfully');
        }
        
        // If language was changed, update the UI language
        if (languageChanged) {
          languageManager.setLanguage(newPreferredLanguage);
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

// Validate phone number format
function isValidPhoneNumber(phone) {
  // Basic validation: must start with + and contain at least 10 digits
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  return cleanPhone.startsWith('+') && cleanPhone.length >= 11 && cleanPhone.length <= 16;
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
