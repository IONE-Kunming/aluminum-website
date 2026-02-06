import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';

export function renderNotifications() {
  const profile = authManager.getUserProfile();
  
  const content = `
    <div class="notifications-page">
      <div class="page-header">
        <h1>Notifications</h1>
        <p>Stay updated with your activity</p>
      </div>

      <div class="empty-state">
        <i data-lucide="bell" style="width: 64px; height: 64px; opacity: 0.3;"></i>
        <h2>No notifications</h2>
        <p>You're all caught up!</p>
      </div>
    </div>
  `;

  renderPageWithLayout(content, profile?.role);
  if (window.lucide) window.lucide.createIcons();
}
