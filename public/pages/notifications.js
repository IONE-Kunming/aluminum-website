import { renderPageWithLayout } from '../js/layout.js';
import languageManager from '../js/language.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml } from '../js/utils.js';

export async function renderNotifications() {
  const t = languageManager.t.bind(languageManager);
  const profile = authManager.getUserProfile();
  const user = authManager.getCurrentUser();
  
  let notifications = [];
  if (user) {
    notifications = await dataService.getNotifications(user.uid);
  }
  
  const content = `
    <div class="notifications-page">
      <div class="page-header">
        <h1>${t('notifications.title')}</h1>
        <p>${t('notifications.subtitle')}</p>
      </div>

      ${notifications.length === 0 ? `
        <div class="empty-state">
          <i data-lucide="bell" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>${t('notifications.noNotifications')}</h2>
          <p>${t('notifications.allCaughtUp')}</p>
        </div>
      ` : `
        <div class="notifications-list">
          ${notifications.map(notif => {
            const timestamp = notif.createdAt ? 
              (notif.createdAt.toDate ? notif.createdAt.toDate() : new Date(notif.createdAt)) : 
              new Date();
            const timeStr = timestamp.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            return `
              <div class="notification-card card ${notif.read ? 'read' : 'unread'}" data-notification-id="${notif.id}">
                <div class="notification-icon ${notif.type || 'default'}">
                  <i data-lucide="${getNotificationIcon(notif.type)}"></i>
                </div>
                <div class="notification-content">
                  <h4>${escapeHtml(notif.title || t('notifications.notification'))}</h4>
                  <p>${escapeHtml(notif.message || '')}</p>
                  <span class="notification-time">${timeStr}</span>
                </div>
                ${!notif.read ? `
                  <button class="btn-mark-read" data-notification-id="${notif.id}" title="${t('notifications.markAsRead')}">
                    <i data-lucide="check"></i>
                  </button>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;

  renderPageWithLayout(content, profile?.role);
  if (window.lucide) window.lucide.createIcons();
  
  // Initialize notification actions
  if (notifications.length > 0) {
    initializeNotificationActions();
  }
}

function getNotificationIcon(type) {
  const icons = {
    'chat': 'message-circle',
    'order': 'shopping-bag',
    'payment': 'credit-card',
    'system': 'bell',
    'default': 'info'
  };
  return icons[type] || icons.default;
}

function initializeNotificationActions() {
  // Mark as read buttons
  document.querySelectorAll('.btn-mark-read').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const notificationId = btn.dataset.notificationId;
      
      try {
        await dataService.markNotificationAsRead(notificationId);
        
        // Update UI
        const card = btn.closest('.notification-card');
        if (card) {
          card.classList.remove('unread');
          card.classList.add('read');
          btn.remove();
        }
        
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    });
  });
  
  // Click on notification card
  document.querySelectorAll('.notification-card').forEach(card => {
    card.addEventListener('click', async () => {
      const notificationId = card.dataset.notificationId;
      
      // Mark as read if unread
      if (card.classList.contains('unread')) {
        try {
          await dataService.markNotificationAsRead(notificationId);
          card.classList.remove('unread');
          card.classList.add('read');
          
          const markReadBtn = card.querySelector('.btn-mark-read');
          if (markReadBtn) markReadBtn.remove();
          
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      }
    });
  });
}
