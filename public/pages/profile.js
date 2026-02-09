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
            <div style="display: flex; gap: 10px; align-items: flex-start;">
              <div style="flex: 1;">
                <input 
                  type="tel" 
                  class="form-control" 
                  id="phoneNumber" 
                  value="${escapeHtml(profile?.phoneNumber || '')}" 
                  placeholder="+1234567890"
                  inputmode="numeric"
                  pattern="[0-9+\\-\\s()]+"
                >
                <small style="color: #6b7280; font-size: 12px;">Enter your phone number with country code</small>
              </div>
              <button type="button" class="btn btn-secondary" id="verify-phone-btn" style="margin-top: 0;">
                <i data-lucide="check-circle"></i>
                Verify
              </button>
            </div>
            <div id="otp-verification" style="display: none; margin-top: 15px; padding: 15px; background: var(--hover-bg); border-radius: 8px;">
              <label style="margin-bottom: 8px; display: block;">Enter OTP Code</label>
              <div style="display: flex; gap: 10px;">
                <input 
                  type="text" 
                  class="form-control" 
                  id="otp-code" 
                  placeholder="Enter 6-digit code"
                  maxlength="6"
                  inputmode="numeric"
                  pattern="[0-9]{6}"
                  style="flex: 1;"
                >
                <button type="button" class="btn btn-primary" id="verify-otp-btn">Verify OTP</button>
              </div>
              <small style="color: #6b7280; font-size: 12px; display: block; margin-top: 8px;">
                Check your phone for the verification code
              </small>
            </div>
            ${profile?.phoneVerified ? `
              <div style="margin-top: 8px; color: #10b981; font-size: 0.85rem;">
                <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
                Phone number verified
              </div>
            ` : ''}
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
  const saveBtn = document.getElementById('save-profile-btn');
  const verifyPhoneBtn = document.getElementById('verify-phone-btn');
  const verifyOtpBtn = document.getElementById('verify-otp-btn');
  const otpVerification = document.getElementById('otp-verification');
  const otpCodeInput = document.getElementById('otp-code');
  
  if (!form) return;
  
  let pendingPhoneNumber = null;
  let verificationId = null;
  
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
  
  // Prevent non-numeric characters in OTP code
  if (otpCodeInput) {
    otpCodeInput.addEventListener('input', (e) => {
      const cursorPosition = e.target.selectionStart;
      const oldValue = e.target.value;
      const newValue = oldValue.replace(/[^0-9]/g, '');
      
      if (oldValue !== newValue) {
        e.target.value = newValue;
        e.target.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
      }
    });
    
    otpCodeInput.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      const cleanedText = pastedText.replace(/[^0-9]/g, '').substring(0, 6);
      
      // Insert cleaned text
      const start = otpCodeInput.selectionStart;
      const end = otpCodeInput.selectionEnd;
      const currentValue = otpCodeInput.value;
      otpCodeInput.value = currentValue.substring(0, start) + cleanedText + currentValue.substring(end);
      otpCodeInput.value = otpCodeInput.value.substring(0, 6); // Enforce max length
      otpCodeInput.selectionStart = otpCodeInput.selectionEnd = Math.min(start + cleanedText.length, 6);
    });
  }
  
  // Verify phone number button
  verifyPhoneBtn.addEventListener('click', async () => {
    const phoneNumber = phoneInput.value.trim();
    
    if (!phoneNumber) {
      window.toast.error('Please enter a phone number');
      return;
    }
    
    if (!isValidPhoneNumber(phoneNumber)) {
      window.toast.error('Please enter a valid phone number with country code (e.g., +1234567890)');
      return;
    }
    
    try {
      verifyPhoneBtn.disabled = true;
      verifyPhoneBtn.innerHTML = '<i data-lucide="loader"></i> Sending...';
      if (window.lucide) window.lucide.createIcons();
      
      // Send OTP (mock implementation - in production use Firebase Phone Auth or SMS service)
      verificationId = await sendOTP(phoneNumber);
      pendingPhoneNumber = phoneNumber;
      
      // Show OTP verification section
      otpVerification.style.display = 'block';
      window.toast.success('Verification code sent to your phone');
      
    } catch (error) {
      console.error('Error sending OTP:', error);
      window.toast.error('Failed to send verification code: ' + error.message);
    } finally {
      verifyPhoneBtn.disabled = false;
      verifyPhoneBtn.innerHTML = '<i data-lucide="check-circle"></i> Verify';
      if (window.lucide) window.lucide.createIcons();
    }
  });
  
  // Verify OTP button
  if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener('click', async () => {
      const otpCode = otpCodeInput.value.trim();
      
      if (!otpCode || otpCode.length !== 6) {
        window.toast.error('Please enter the 6-digit verification code');
        return;
      }
      
      try {
        verifyOtpBtn.disabled = true;
        verifyOtpBtn.innerHTML = '<i data-lucide="loader"></i> Verifying...';
        if (window.lucide) window.lucide.createIcons();
        
        // Verify OTP (mock implementation)
        const isValid = await verifyOTP(verificationId, otpCode);
        
        if (isValid) {
          // Update profile with verified phone number
          await authManager.updateProfileFields({
            phoneNumber: pendingPhoneNumber,
            phoneVerified: true
          });
          
          window.toast.success('Phone number verified and updated successfully');
          otpVerification.style.display = 'none';
          otpCodeInput.value = '';
          
          // Reload page to show verified status
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          window.toast.error('Invalid verification code. Please try again.');
        }
        
      } catch (error) {
        console.error('Error verifying OTP:', error);
        window.toast.error('Verification failed: ' + error.message);
      } finally {
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.innerHTML = 'Verify OTP';
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }
  
  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newDisplayName = displayNameInput?.value.trim();
    const newEmail = emailInput?.value.trim();
    const newPhone = phoneInput?.value.trim();
    
    // Check if anything changed
    const displayNameChanged = newDisplayName !== (profile?.displayName || '');
    const emailChanged = newEmail !== user?.email;
    const phoneChanged = newPhone !== (profile?.phoneNumber || '');
    
    if (!displayNameChanged && !emailChanged && !phoneChanged) {
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
    
    // Check if phone number changed and needs verification
    if (phoneChanged) {
      // If phone number changed but not verified, warn but still save other changes
      if (!profile?.phoneVerified && pendingPhoneNumber !== newPhone) {
        window.toast.warning('Phone number changes require verification. Other changes will be saved.');
        // Don't include phone in updates
      } else if (profile?.phoneVerified || pendingPhoneNumber === newPhone) {
        // Include phone if it was verified
        updates.phoneNumber = newPhone;
        if (pendingPhoneNumber === newPhone) {
          updates.phoneVerified = true;
        }
      }
    }
    
    try {
      // Disable form while updating
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i data-lucide="loader"></i> Saving...';
      if (window.lucide) window.lucide.createIcons();
      
      const updates = {};
      if (displayNameChanged) updates.displayName = newDisplayName;
      if (emailChanged) updates.email = newEmail;
      
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

// Mock OTP sending function (replace with actual SMS service in production)
// WARNING: This is for DEMO purposes only. In production, use a secure backend service.
async function sendOTP(phoneNumber) {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In production, use Firebase Phone Authentication or SMS service like Twilio
  // For now, generate a mock verification ID
  const verificationId = 'mock_' + Date.now();
  
  // SECURITY WARNING: Storing OTP in sessionStorage is insecure and only for demo
  // In production, OTP should be validated on the server side
  const mockOTP = Math.floor(100000 + Math.random() * 900000).toString();
  sessionStorage.setItem(verificationId, mockOTP);
  
  // Only log in development mode
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('[DEV ONLY] Mock OTP sent:', mockOTP);
  }
  
  return verificationId;
}

// Mock OTP verification function (replace with actual verification in production)
// WARNING: This is for DEMO purposes only. In production, use secure server-side validation.
async function verifyOTP(verificationId, otpCode) {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // SECURITY WARNING: This client-side validation is insecure and only for demo
  const storedOTP = sessionStorage.getItem(verificationId);
  
  if (storedOTP === otpCode) {
    sessionStorage.removeItem(verificationId);
    return true;
  }
  
  return false;
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
