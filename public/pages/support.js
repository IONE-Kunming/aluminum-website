import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';

export function renderSupport() {
  const profile = authManager.getUserProfile();
  
  const content = `
    <div class="support-page">
      <div class="page-header">
        <h1>Support Center</h1>
        <p>Get help with your account and orders</p>
      </div>

      <div class="support-grid">
        <div class="support-card card">
          <i data-lucide="help-circle" style="width: 48px; height: 48px;"></i>
          <h3>FAQ</h3>
          <p>Find answers to common questions</p>
          <button class="btn btn-secondary">Browse FAQ</button>
        </div>
        <div class="support-card card">
          <i data-lucide="message-circle" style="width: 48px; height: 48px;"></i>
          <h3>Contact Us</h3>
          <p>Reach out to our support team</p>
          <button class="btn btn-secondary">Send Message</button>
        </div>
        <div class="support-card card">
          <i data-lucide="book" style="width: 48px; height: 48px;"></i>
          <h3>Documentation</h3>
          <p>Learn how to use the platform</p>
          <button class="btn btn-secondary">View Docs</button>
        </div>
      </div>
    </div>
  `;

  renderPageWithLayout(content, profile?.role);
  if (window.lucide) window.lucide.createIcons();
}
