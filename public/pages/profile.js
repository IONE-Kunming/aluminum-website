import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml } from '../js/utils.js';
import languageManager from '../js/language.js';

const COUNTRY_CODES = [
  { flag: '🇦🇪', code: '+971', name: 'UAE' },
  { flag: '🇸🇦', code: '+966', name: 'Saudi Arabia' },
  { flag: '🇵🇰', code: '+92', name: 'Pakistan' },
  { flag: '🇮🇳', code: '+91', name: 'India' },
  { flag: '🇨🇳', code: '+86', name: 'China' },
  { flag: '🇺🇸', code: '+1', name: 'USA' },
  { flag: '🇬🇧', code: '+44', name: 'UK' },
  { flag: '🇦🇺', code: '+61', name: 'Australia' },
  { flag: '🇨🇦', code: '+1', name: 'Canada' },
  { flag: '🇩🇪', code: '+49', name: 'Germany' },
  { flag: '🇫🇷', code: '+33', name: 'France' },
  { flag: '🇯🇵', code: '+81', name: 'Japan' },
  { flag: '🇰🇷', code: '+82', name: 'South Korea' },
  { flag: '🇧🇷', code: '+55', name: 'Brazil' },
  { flag: '🇲🇽', code: '+52', name: 'Mexico' },
  { flag: '🇪🇬', code: '+20', name: 'Egypt' },
  { flag: '🇳🇬', code: '+234', name: 'Nigeria' },
  { flag: '🇹🇷', code: '+90', name: 'Turkey' },
  { flag: '🇷🇺', code: '+7', name: 'Russia' },
  { flag: '🇮🇹', code: '+39', name: 'Italy' },
  { flag: '🇪🇸', code: '+34', name: 'Spain' },
  { flag: '🇳🇱', code: '+31', name: 'Netherlands' },
  { flag: '🇸🇬', code: '+65', name: 'Singapore' },
  { flag: '🇲🇾', code: '+60', name: 'Malaysia' },
  { flag: '🇮🇩', code: '+62', name: 'Indonesia' },
  { flag: '🇵🇭', code: '+63', name: 'Philippines' },
  { flag: '🇹🇭', code: '+66', name: 'Thailand' },
  { flag: '🇻🇳', code: '+84', name: 'Vietnam' },
  { flag: '🇿🇦', code: '+27', name: 'South Africa' },
  { flag: '🇦🇷', code: '+54', name: 'Argentina' },
];

function parsePhoneNumber(fullPhone) {
  const defaultCode = COUNTRY_CODES[0].code; // UAE (+971) as default
  if (!fullPhone || !fullPhone.startsWith('+')) return { countryCode: defaultCode, localNumber: fullPhone || '' };
  // Sort by code length descending for longest-match-first
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const country of sorted) {
    if (fullPhone.startsWith(country.code)) {
      return { countryCode: country.code, localNumber: fullPhone.slice(country.code.length) };
    }
  }
  return { countryCode: defaultCode, localNumber: fullPhone };
}

export function renderProfile() {
  const profile = authManager.getUserProfile();
  const user = authManager.getCurrentUser();
  const t = languageManager.t.bind(languageManager);
  const { countryCode: savedCountryCode, localNumber: savedLocalNumber } = parsePhoneNumber(profile?.phoneNumber || '');
  
  const countryCodeOptions = COUNTRY_CODES.map(c => {
    const val = `${c.code}|${c.name}`;
    const isSelected = c.code === savedCountryCode;
    return `<option value="${val}" ${isSelected ? 'selected' : ''}>${c.flag} ${c.code} ${c.name}</option>`;
  }).join('');

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
            <div class="phone-input-group" style="display: flex; gap: 8px; align-items: center;">
              <select class="form-control" id="countryCode" style="width: 160px; flex-shrink: 0;">
                ${countryCodeOptions}
              </select>
              <input 
                type="tel" 
                class="form-control" 
                id="localPhone"
                style="flex: 1;"
                value="${escapeHtml(savedLocalNumber)}" 
                placeholder="501234567"
                inputmode="numeric"
              >
            </div>
            <input type="hidden" id="phoneNumber" value="${escapeHtml(profile?.phoneNumber || '')}">
            <small style="color: #6b7280; font-size: 12px;">Select country code and enter local number (digits only)</small>
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

      ${profile?.role === 'seller' ? `
      <div class="profile-section card" style="margin-top: 24px;">
        <h3><i data-lucide="credit-card" style="width: 20px; height: 20px; vertical-align: middle;"></i> ${t('paymentMethods.title')}</h3>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">${t('paymentMethods.description')}</p>
        <form id="payment-methods-form">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label>${t('paymentMethods.bankName')}</label>
              <input type="text" class="form-control" id="pm-bankName" value="${escapeHtml(profile?.paymentMethods?.bankName || '')}" placeholder="${t('paymentMethods.bankNamePlaceholder')}" required>
            </div>
            <div class="form-group">
              <label>${t('paymentMethods.accountHolderName')}</label>
              <input type="text" class="form-control" id="pm-accountName" value="${escapeHtml(profile?.paymentMethods?.accountName || '')}" placeholder="${t('paymentMethods.accountHolderPlaceholder')}" required>
            </div>
            <div class="form-group">
              <label>${t('paymentMethods.accountNumberIban')}</label>
              <input type="text" class="form-control" id="pm-accountNumber" value="${escapeHtml(profile?.paymentMethods?.accountNumber || '')}" placeholder="${t('paymentMethods.accountNumberPlaceholder')}" required>
            </div>
            <div class="form-group">
              <label>${t('paymentMethods.swiftBicCode')}</label>
              <input type="text" class="form-control" id="pm-swiftCode" value="${escapeHtml(profile?.paymentMethods?.swiftCode || '')}" placeholder="${t('paymentMethods.swiftPlaceholder')}" required>
            </div>
            <div class="form-group">
              <label>${t('paymentMethods.bankBranchCity')}</label>
              <input type="text" class="form-control" id="pm-bankBranch" value="${escapeHtml(profile?.paymentMethods?.bankBranch || '')}" placeholder="${t('paymentMethods.bankBranchPlaceholder')}">
            </div>
            <div class="form-group">
              <label>${t('paymentMethods.currency')}</label>
              <select class="form-control" id="pm-currency">
                <option value="USD" ${(profile?.paymentMethods?.currency || 'USD') === 'USD' ? 'selected' : ''}>USD - US Dollar</option>
                <option value="CNY" ${profile?.paymentMethods?.currency === 'CNY' ? 'selected' : ''}>CNY - Chinese Yuan</option>
                <option value="EUR" ${profile?.paymentMethods?.currency === 'EUR' ? 'selected' : ''}>EUR - Euro</option>
                <option value="GBP" ${profile?.paymentMethods?.currency === 'GBP' ? 'selected' : ''}>GBP - British Pound</option>
                <option value="AED" ${profile?.paymentMethods?.currency === 'AED' ? 'selected' : ''}>AED - UAE Dirham</option>
                <option value="SAR" ${profile?.paymentMethods?.currency === 'SAR' ? 'selected' : ''}>SAR - Saudi Riyal</option>
                <option value="PKR" ${profile?.paymentMethods?.currency === 'PKR' ? 'selected' : ''}>PKR - Pakistani Rupee</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-top: 12px;">
            <label>${t('paymentMethods.additionalNotes')}</label>
            <textarea class="form-control" id="pm-notes" rows="2" placeholder="${t('paymentMethods.additionalNotesPlaceholder')}">${escapeHtml(profile?.paymentMethods?.notes || '')}</textarea>
          </div>

          ${profile?.paymentMethods?.bankName && profile?.paymentMethods?.accountNumber && profile?.paymentMethods?.swiftCode ? `
          <div style="padding: 12px 16px; background: #ecfdf5; border: 1px solid #86efac; border-radius: 8px; margin-top: 12px; display: flex; align-items: center; gap: 8px;">
            <i data-lucide="check-circle" style="width: 18px; height: 18px; color: #16a34a;"></i>
            <span style="color: #15803d; font-size: 14px; font-weight: 500;">${t('paymentMethods.detailsComplete')}</span>
          </div>
          ` : `
          <div style="padding: 12px 16px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; margin-top: 12px; display: flex; align-items: center; gap: 8px;">
            <i data-lucide="alert-circle" style="width: 18px; height: 18px; color: #ea580c;"></i>
            <span style="color: #c2410c; font-size: 14px; font-weight: 500;">${t('paymentMethods.detailsIncomplete')}</span>
          </div>
          `}

          <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button type="submit" class="btn btn-primary" id="save-payment-btn">
              <i data-lucide="save"></i>
              ${t('paymentMethods.savePaymentDetails')}
            </button>
          </div>
        </form>
      </div>
      ` : ''}
    </div>
  `;

  renderPageWithLayout(content, profile?.role);
  if (window.lucide) window.lucide.createIcons();
  
  // Initialize profile form handlers
  initProfileHandlers(profile, user);

  // Initialize payment methods form handlers (seller only)
  if (profile?.role === 'seller') {
    initPaymentMethodsHandlers(profile, user);
  }
}

function initProfileHandlers(profile, user) {
  const form = document.getElementById('profile-form');
  const displayNameInput = document.getElementById('displayName');
  const emailInput = document.getElementById('email');
  const phoneHiddenInput = document.getElementById('phoneNumber');
  const countryCodeSelect = document.getElementById('countryCode');
  const localPhoneInput = document.getElementById('localPhone');
  const preferredLanguageSelect = document.getElementById('preferredLanguage');
  const saveBtn = document.getElementById('save-profile-btn');
  
  if (!form) return;

  // Update hidden phone field when either dropdown or local phone changes
  const updateFullPhone = () => {
    const selectedVal = countryCodeSelect?.value || '+1|USA';
    const cc = selectedVal.split('|')[0];
    const local = (localPhoneInput?.value || '').replace(/\D/g, '');
    phoneHiddenInput.value = local ? cc + local : '';
  };

  // Only allow digits in local phone input
  if (localPhoneInput) {
    localPhoneInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
      updateFullPhone();
    });
    localPhoneInput.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      const start = localPhoneInput.selectionStart;
      const end = localPhoneInput.selectionEnd;
      localPhoneInput.value = localPhoneInput.value.substring(0, start) + pasted + localPhoneInput.value.substring(end);
      updateFullPhone();
    });
  }

  if (countryCodeSelect) {
    countryCodeSelect.addEventListener('change', updateFullPhone);
  }
  
  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newDisplayName = displayNameInput?.value.trim();
    const newEmail = emailInput?.value.trim();
    const newPhone = phoneHiddenInput?.value.trim();
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

function initPaymentMethodsHandlers(profile, user) {
  const t = languageManager.t.bind(languageManager);
  const form = document.getElementById('payment-methods-form');
  const saveBtn = document.getElementById('save-payment-btn');
  if (!form || !saveBtn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const bankName = document.getElementById('pm-bankName')?.value.trim() || '';
    const accountName = document.getElementById('pm-accountName')?.value.trim() || '';
    const accountNumber = document.getElementById('pm-accountNumber')?.value.trim() || '';
    const swiftCode = document.getElementById('pm-swiftCode')?.value.trim() || '';
    const bankBranch = document.getElementById('pm-bankBranch')?.value.trim() || '';
    const currency = document.getElementById('pm-currency')?.value || 'USD';
    const notes = document.getElementById('pm-notes')?.value.trim() || '';

    if (!bankName || !accountName || !accountNumber || !swiftCode) {
      if (window.toast) {
        window.toast.error(t('paymentMethods.bankNameAccountRequired'));
      }
      return;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i data-lucide="loader"></i> ' + t('common.loading');
      if (window.lucide) window.lucide.createIcons();

      await dataService.init();
      await dataService.db.collection('users').doc(user.uid).set({
        paymentMethods: { bankName, accountName, accountNumber, swiftCode, bankBranch, currency, notes }
      }, { merge: true });

      if (window.toast) {
        window.toast.success(t('paymentMethods.savedSuccess'));
      }
    } catch (error) {
      console.error('Error saving payment methods:', error);
      if (window.toast) {
        window.toast.error(t('paymentMethods.savedError') + error.message);
      }
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i data-lucide="save"></i> ' + t('paymentMethods.savePaymentDetails');
      if (window.lucide) window.lucide.createIcons();
    }
  });
}

// Validate phone number format
function isValidPhoneNumber(phone) {
  // Lenient: must start with + and have at least 7 digits total
  const digits = phone.replace(/\D/g, '');
  return phone.startsWith('+') && digits.length >= 7;
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
