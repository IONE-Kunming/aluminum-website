import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import languageManager from '../js/language.js';

export function renderSupport() {
  const profile = authManager.getUserProfile();
  const t = languageManager.t.bind(languageManager);
  
  const content = `
    <div class="support-page">
      <div class="page-header">
        <h1>${t('support.title') || 'Support Center'}</h1>
        <p>${t('support.subtitle') || 'Get help with your account and orders'}</p>
      </div>

      <div class="support-content" style="max-width: 800px; margin: 0 auto;">
        <div class="card" style="padding: var(--spacing-xl);">
          <div style="text-align: center; margin-bottom: var(--spacing-xl);">
            <i data-lucide="message-circle" style="width: 64px; height: 64px; color: var(--electric-blue);"></i>
            <h2 style="margin: var(--spacing-md) 0;">${t('support.contactUs') || 'Contact Us'}</h2>
            <p style="color: var(--text-secondary);">${t('support.contactDescription') || 'Have a question or need assistance? Fill out the form below and we\'ll get back to you as soon as possible.'}</p>
          </div>

          <form id="support-form" style="display: flex; flex-direction: column; gap: var(--spacing-md);">
            <div class="form-group">
              <label for="support-name">${t('common.name') || 'Name'} <span style="color: var(--error);">*</span></label>
              <input 
                type="text" 
                id="support-name" 
                class="form-control" 
                value="${profile?.displayName || ''}"
                required
              />
            </div>

            <div class="form-group">
              <label for="support-email">${t('common.email') || 'Email'} <span style="color: var(--error);">*</span></label>
              <input 
                type="email" 
                id="support-email" 
                class="form-control" 
                value="${profile?.email || ''}"
                required
              />
            </div>

            <div class="form-group">
              <label for="support-subject">${t('support.subject') || 'Subject'} <span style="color: var(--error);">*</span></label>
              <input 
                type="text" 
                id="support-subject" 
                class="form-control" 
                placeholder="${t('support.subjectPlaceholder') || 'Brief description of your inquiry'}"
                required
              />
            </div>

            <div class="form-group">
              <label for="support-message">${t('support.message') || 'Message'} <span style="color: var(--error);">*</span></label>
              <textarea 
                id="support-message" 
                class="form-control" 
                rows="6"
                placeholder="${t('support.messagePlaceholder') || 'Please provide details about your inquiry...'}"
                required
              ></textarea>
            </div>

            <div style="display: flex; gap: var(--spacing-md); justify-content: flex-end;">
              <button type="button" class="btn btn-secondary" id="cancel-btn">
                ${t('common.cancel') || 'Cancel'}
              </button>
              <button type="submit" class="btn btn-primary">
                <i data-lucide="send"></i>
                ${t('support.sendMessage') || 'Send Message'}
              </button>
            </div>
          </form>
        </div>

        <div class="support-info" style="margin-top: var(--spacing-xl); text-align: center;">
          <p style="color: var(--text-secondary);">
            ${t('support.directContact') || 'You can also reach us directly at'}: 
            <a href="mailto:contactus@ione.live" style="color: var(--electric-blue); text-decoration: none; font-weight: 600;">
              contactus@ione.live
            </a>
          </p>
        </div>
      </div>
    </div>
  `;

  renderPageWithLayout(content, profile?.role);
  if (window.lucide) window.lucide.createIcons();

  // Handle form submission
  const form = document.getElementById('support-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('support-name').value;
      const email = document.getElementById('support-email').value;
      const subject = document.getElementById('support-subject').value;
      const message = document.getElementById('support-message').value;
      
      // Create mailto link with pre-filled content
      const mailtoLink = `mailto:contactus@ione.live?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\n${message}`
      )}`;
      
      // Open email client
      window.location.href = mailtoLink;
      
      // Show success message
      if (window.toast) {
        window.toast.success(t('support.messageSent') || 'Opening your email client. Please send the email to complete your request.');
      }
      
      // Clear form after a delay
      setTimeout(() => {
        form.reset();
      }, 1000);
    });
  }

  // Handle cancel button
  const cancelBtn = document.getElementById('cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      window.history.back();
    });
  }
}

