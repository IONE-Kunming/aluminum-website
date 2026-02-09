import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import languageManager from '../js/language.js';
import { escapeHtml, sanitizeUrl } from '../js/utils.js';

let unsubscribers = [];

export async function renderBuyerChats() {
  const profile = authManager.getUserProfile();
  const t = languageManager.t.bind(languageManager);
  
  const content = `
    <div class="chats-page">
      <div class="page-header">
        <h1>${t('chats.title') || 'Chats'}</h1>
        <p>${t('chats.subtitle') || 'Your conversations with sellers'}</p>
      </div>

      <div class="chats-container">
        <div class="chats-list-container card">
          <h3>${t('chats.conversations') || 'Conversations'}</h3>
          <div id="chats-list" class="chats-list">
            <div class="loading">${t('common.loading') || 'Loading...'}</div>
          </div>
        </div>

        <div class="chat-window-container card">
          <div id="chat-window-placeholder" class="chat-placeholder">
            <i data-lucide="message-circle" style="width: 64px; height: 64px; color: var(--text-muted);"></i>
            <p>${t('chats.selectChat') || 'Select a conversation to start chatting'}</p>
          </div>
          <div id="chat-window" class="chat-window" style="display: none;">
            <div class="chat-header">
              <div class="chat-user-info">
                <div id="chat-user-avatar" class="chat-avatar"></div>
                <div>
                  <h4 id="chat-user-name">Seller Name</h4>
                  <p id="chat-user-status" class="text-muted">Online</p>
                </div>
              </div>
              <button class="btn-icon" id="toggle-documents-btn" title="${t('chats.documents') || 'Documents'}">
                <i data-lucide="file-text"></i>
              </button>
            </div>
            
            <div id="chat-messages" class="chat-messages">
              <div class="loading">${t('common.loading') || 'Loading messages...'}</div>
            </div>
            
            <div class="chat-input-container">
              <input type="file" id="chat-file-input" accept="image/*,video/*,application/pdf" multiple style="display: none;" />
              <button class="btn-icon" id="attach-btn" title="${t('chats.attachFile') || 'Attach file'}">
                <i data-lucide="paperclip"></i>
              </button>
              <input type="text" id="chat-message-input" placeholder="${t('chats.typeMessage') || 'Type a message...'}" />
              <button class="btn btn-primary" id="send-message-btn">
                <i data-lucide="send"></i>
                ${t('chats.send') || 'Send'}
              </button>
            </div>
            
            <div id="selected-files" class="selected-files"></div>
          </div>
        </div>

        <div id="documents-sidebar" class="documents-sidebar card" style="display: none;">
          <div class="documents-sidebar-header">
            <h3>${t('chats.sharedDocuments') || 'Shared Documents'}</h3>
            <button class="btn-icon" id="close-documents-btn">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div id="documents-list" class="documents-list">
            <div class="empty-state">
              <i data-lucide="file" style="width: 48px; height: 48px;"></i>
              <p>${t('chats.noDocuments') || 'No documents shared yet'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  renderPageWithLayout(content, profile?.role);
  
  if (window.lucide) window.lucide.createIcons();
  
  await loadChats();
  initializeChatEventHandlers();
}

let selectedFiles = [];
let currentChatId = null;
let currentSellerId = null;
let allMessages = []; // Store all messages for document extraction
let renderedMessageIds = new Set(); // Track which messages are already rendered

async function loadChats() {
  try {
    const chats = await dataService.getUserChats();
    const chatsList = document.getElementById('chats-list');
    
    if (!chats || chats.length === 0) {
      chatsList.innerHTML = `
        <div class="empty-state">
          <i data-lucide="message-circle" style="width: 48px; height: 48px;"></i>
          <p>No conversations yet</p>
          <p class="text-muted">Start chatting with sellers from their product pages</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }
    
    chatsList.innerHTML = chats.map(chat => {
      const lastMessageTime = chat.lastMessageTime?.toDate?.() || new Date(chat.lastMessageTime);
      const timeStr = formatTime(lastMessageTime);
      const avatarLetter = (chat.otherUserName || 'U').charAt(0).toUpperCase();
      const safeName = escapeHtml(chat.otherUserName || 'User');
      const safeLastMessage = escapeHtml(chat.lastMessage || 'No messages yet');
      const role = chat.otherUserRole || 'seller';
      const roleLabel = role === 'seller' ? 'Seller' : role.charAt(0).toUpperCase() + role.slice(1);
      
      return `
        <div class="chat-item" data-chat-id="${chat.id}" data-seller-id="${chat.otherUserId}">
          <div class="chat-avatar">${avatarLetter}</div>
          <div class="chat-info">
            <div class="chat-name">
              ${safeName}
              <span class="chat-role-badge" style="font-size: 0.75rem; color: var(--text-muted); margin-left: 4px;">${roleLabel}</span>
            </div>
            <div class="chat-last-message">${safeLastMessage}</div>
          </div>
          <div class="chat-time">${timeStr}</div>
        </div>
      `;
    }).join('');
    
    if (window.lucide) window.lucide.createIcons();
    
  } catch (error) {
    console.error('Error loading chats:', error);
    const chatsList = document.getElementById('chats-list');
    chatsList.innerHTML = `<div class="error">Failed to load chats</div>`;
  }
}

function initializeChatEventHandlers() {
  const chatsList = document.getElementById('chats-list');
  const sendBtn = document.getElementById('send-message-btn');
  const messageInput = document.getElementById('chat-message-input');
  const attachBtn = document.getElementById('attach-btn');
  const fileInput = document.getElementById('chat-file-input');
  const toggleDocumentsBtn = document.getElementById('toggle-documents-btn');
  const closeDocumentsBtn = document.getElementById('close-documents-btn');
  
  // Handle chat selection
  chatsList?.addEventListener('click', (e) => {
    const chatItem = e.target.closest('.chat-item');
    if (chatItem) {
      const sellerId = chatItem.dataset.sellerId;
      const chatId = chatItem.dataset.chatId;
      const sellerName = chatItem.querySelector('.chat-name')?.textContent || 'Seller';
      selectChat(chatId, sellerId, sellerName);
      
      // Mark as active
      document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
      chatItem.classList.add('active');
    }
  });
  
  // Handle send message
  sendBtn?.addEventListener('click', sendMessage);
  messageInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // Handle file attachment
  attachBtn?.addEventListener('click', () => {
    fileInput?.click();
  });
  
  fileInput?.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    selectedFiles = [...selectedFiles, ...files];
    displaySelectedFiles();
  });

  // Handle documents sidebar toggle
  toggleDocumentsBtn?.addEventListener('click', () => {
    const sidebar = document.getElementById('documents-sidebar');
    const container = document.querySelector('.chats-container');
    if (sidebar.style.display === 'none') {
      sidebar.style.display = 'flex';
      container.classList.add('with-sidebar');
    } else {
      sidebar.style.display = 'none';
      container.classList.remove('with-sidebar');
    }
    if (window.lucide) window.lucide.createIcons();
  });

  closeDocumentsBtn?.addEventListener('click', () => {
    const sidebar = document.getElementById('documents-sidebar');
    const container = document.querySelector('.chats-container');
    sidebar.style.display = 'none';
    container.classList.remove('with-sidebar');
  });
}

async function selectChat(chatId, sellerId, sellerName) {
  currentChatId = chatId;
  currentSellerId = sellerId;
  
  // Update chat header with seller info
  const displayName = sellerName || 'Seller';
  const chatUserName = document.getElementById('chat-user-name');
  const chatUserAvatar = document.getElementById('chat-user-avatar');
  if (chatUserName) chatUserName.textContent = displayName;
  if (chatUserAvatar) chatUserAvatar.textContent = displayName.charAt(0).toUpperCase();
  
  // Show chat window
  document.getElementById('chat-window-placeholder').style.display = 'none';
  document.getElementById('chat-window').style.display = 'flex';
  
  // Load messages
  loadMessages(sellerId);
}

async function loadMessages(sellerId) {
  const messagesContainer = document.getElementById('chat-messages');
  messagesContainer.innerHTML = '<div class="loading">Loading messages...</div>';
  
  // Unsubscribe from previous chat
  unsubscribers.forEach(unsub => unsub());
  unsubscribers = [];
  
  // Reset rendered messages tracking
  renderedMessageIds.clear();
  
  try {
    const unsubscribe = await dataService.subscribeToChatMessages(sellerId, (messages) => {
      displayMessages(messages);
    });
    unsubscribers.push(unsubscribe);
  } catch (error) {
    console.error('Error loading messages:', error);
    messagesContainer.innerHTML = '<div class="error">Failed to load messages</div>';
  }
}

function displayMessages(messages) {
  const messagesContainer = document.getElementById('chat-messages');
  const currentUser = authManager.getCurrentUser();
  
  // Store messages for document extraction
  allMessages = messages;
  updateDocumentsSidebar();
  
  if (!messages || messages.length === 0) {
    messagesContainer.innerHTML = '<div class="empty-state">No messages yet. Start the conversation!</div>';
    renderedMessageIds.clear();
    return;
  }
  
  // Check if this is a fresh load (no messages rendered yet)
  const isFreshLoad = renderedMessageIds.size === 0;
  
  // Save scroll position
  const wasAtBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop <= messagesContainer.clientHeight + 100;
  
  // Only render new messages (incremental update for better performance)
  messages.forEach((msg, index) => {
    if (renderedMessageIds.has(msg.id)) {
      return; // Skip already rendered messages
    }
    
    const isOwn = msg.senderId === currentUser?.uid;
    const time = msg.createdAt?.toDate?.() || new Date(msg.createdAt);
    const timeStr = formatTime(time);
    
    // Escape message text to prevent XSS
    const safeMessage = escapeHtml(msg.message);
    
    let attachmentsHtml = '';
    if (msg.attachments && msg.attachments.length > 0) {
      attachmentsHtml = '<div class="message-attachments">';
      
      msg.attachments.forEach(att => {
        // Sanitize attachment name and URL
        const safeName = escapeHtml(att.name);
        const safeUrl = sanitizeUrl(att.url);
        
        // Skip if URL is invalid
        if (!safeUrl) {
          console.warn('Skipping attachment with invalid URL:', att.name);
          return;
        }
        
        if (att.type.startsWith('image/')) {
          // Display images inline
          attachmentsHtml += `
            <div class="attachment attachment-inline">
              <img src="${safeUrl}" alt="${safeName}" class="attachment-image" data-url="${safeUrl}" style="cursor: pointer; max-width: 300px; max-height: 300px; border-radius: 8px;" />
              <div class="attachment-actions">
                <span class="attachment-name">${safeName}</span>
                <a href="${safeUrl}" download="${safeName}" class="btn btn-sm btn-secondary" title="Download">
                  <i data-lucide="download"></i>
                </a>
              </div>
            </div>
          `;
        } else if (att.type.startsWith('video/')) {
          // Display videos inline
          attachmentsHtml += `
            <div class="attachment attachment-inline">
              <video controls class="attachment-video" style="max-width: 300px; max-height: 300px; border-radius: 8px;">
                <source src="${safeUrl}" type="${escapeHtml(att.type)}">
                Your browser does not support the video tag.
              </video>
              <div class="attachment-actions">
                <span class="attachment-name">${safeName}</span>
                <a href="${safeUrl}" download="${safeName}" class="btn btn-sm btn-secondary" title="Download">
                  <i data-lucide="download"></i>
                </a>
              </div>
            </div>
          `;
        } else {
          // Display PDF and other files as downloadable attachments only
          attachmentsHtml += `
            <div class="attachment attachment-file">
              <i data-lucide="file"></i>
              <div class="attachment-info">
                <span class="attachment-name">${safeName}</span>
                <span class="attachment-size">${formatFileSize(att.size)}</span>
              </div>
              <a href="${safeUrl}" download="${safeName}" class="btn btn-sm btn-secondary" title="Download">
                <i data-lucide="download"></i>
              </a>
            </div>
          `;
        }
      });
      
      attachmentsHtml += '</div>';
    }
    
    const messageHtml = `
      <div class="message ${isOwn ? 'message-own' : 'message-other'}" data-message-id="${msg.id}">
        <div class="message-content">
          ${safeMessage ? `<div class="message-text">${safeMessage}</div>` : ''}
          ${attachmentsHtml}
          <div class="message-time">${timeStr}</div>
        </div>
      </div>
    `;
    
    // Create temp element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = messageHtml;
    const messageElement = tempDiv.firstElementChild;
    
    // Find correct insertion position (maintain chronological order)
    let inserted = false;
    const existingMessages = messagesContainer.querySelectorAll('.message[data-message-id]');
    
    for (let i = 0; i < existingMessages.length; i++) {
      const existingMsgId = existingMessages[i].dataset.messageId;
      const existingMsgIndex = messages.findIndex(m => m.id === existingMsgId);
      
      if (existingMsgIndex > index) {
        messagesContainer.insertBefore(messageElement, existingMessages[i]);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      messagesContainer.appendChild(messageElement);
    }
    
    // Add click handler for images
    const images = messageElement.querySelectorAll('.attachment-image');
    images.forEach(img => {
      img.addEventListener('click', function() {
        window.open(this.dataset.url, '_blank');
      });
    });
    
    renderedMessageIds.add(msg.id);
  });
  
  // Initialize lucide icons for new elements only
  if (window.lucide) window.lucide.createIcons();
  
  // Scroll to bottom if user was at bottom or if fresh load
  if (wasAtBottom || isFreshLoad) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

async function sendMessage() {
  const messageInput = document.getElementById('chat-message-input');
  const message = messageInput?.value?.trim();
  
  if (!message && selectedFiles.length === 0) {
    return;
  }
  
  if (!currentSellerId) {
    window.toast?.error('Please select a chat first');
    return;
  }
  
  try {
    await dataService.sendChatMessage({
      sellerId: currentSellerId,
      message: message,
      files: selectedFiles
    });
    
    messageInput.value = '';
    selectedFiles = [];
    displaySelectedFiles();
    
    // Clear file input
    const fileInput = document.getElementById('chat-file-input');
    if (fileInput) fileInput.value = '';
    
  } catch (error) {
    console.error('Error sending message:', error);
    window.toast?.error('Failed to send message');
  }
}

function displaySelectedFiles() {
  const container = document.getElementById('selected-files');
  if (!container) return;
  
  if (selectedFiles.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = `
    <div class="selected-files-list">
      ${selectedFiles.map((file, index) => `
        <div class="selected-file">
          <i data-lucide="file"></i>
          <span>${escapeHtml(file.name)}</span>
          <button class="btn-icon file-remove-btn" data-file-index="${index}">
            <i data-lucide="x"></i>
          </button>
        </div>
      `).join('')}
    </div>
  `;
  
  if (window.lucide) window.lucide.createIcons();
  
  // Attach event handlers for remove buttons
  container.querySelectorAll('.file-remove-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const index = parseInt(this.dataset.fileIndex);
      selectedFiles.splice(index, 1);
      displaySelectedFiles();
    });
  });
}

function formatTime(date) {
  if (!date) return '';
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function updateDocumentsSidebar() {
  const documentsList = document.getElementById('documents-list');
  if (!documentsList) return;

  // Extract all attachments from messages
  const documents = [];
  allMessages.forEach(msg => {
    if (msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach(att => {
        documents.push({
          ...att,
          messageTime: msg.createdAt,
          senderName: msg.senderName || 'User'
        });
      });
    }
  });

  if (documents.length === 0) {
    documentsList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="file" style="width: 48px; height: 48px;"></i>
        <p>No documents shared yet</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Group documents by type
  const images = documents.filter(doc => doc.type.startsWith('image/'));
  const videos = documents.filter(doc => doc.type.startsWith('video/'));
  const files = documents.filter(doc => !doc.type.startsWith('image/') && !doc.type.startsWith('video/'));

  let html = '';

  // Images section
  if (images.length > 0) {
    html += `
      <div class="documents-section">
        <div class="documents-section-header">
          <h4><i data-lucide="image"></i> Images (${images.length})</h4>
        </div>
        <div class="documents-grid">
          ${images.map(img => {
            const safeUrl = sanitizeUrl(img.url);
            const safeName = escapeHtml(img.name);
            return `
              <div class="document-item document-image">
                <img src="${safeUrl}" alt="${safeName}" data-url="${safeUrl}" />
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Videos section
  if (videos.length > 0) {
    html += `
      <div class="documents-section">
        <div class="documents-section-header">
          <h4><i data-lucide="video"></i> Videos (${videos.length})</h4>
        </div>
        <div class="documents-list-items">
          ${videos.map(vid => {
            const safeUrl = sanitizeUrl(vid.url);
            const safeName = escapeHtml(vid.name);
            const time = vid.messageTime?.toDate?.() || new Date(vid.messageTime);
            return `
              <div class="document-list-item">
                <div class="document-icon">
                  <i data-lucide="video"></i>
                </div>
                <div class="document-info">
                  <div class="document-name">${safeName}</div>
                  <div class="document-meta">${formatFileSize(vid.size)} • ${formatTime(time)}</div>
                </div>
                <a href="${safeUrl}" download="${safeName}" class="btn-icon" title="Download">
                  <i data-lucide="download"></i>
                </a>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Files section (PDFs and others)
  if (files.length > 0) {
    html += `
      <div class="documents-section">
        <div class="documents-section-header">
          <h4><i data-lucide="file-text"></i> Documents (${files.length})</h4>
        </div>
        <div class="documents-list-items">
          ${files.map(file => {
            const safeUrl = sanitizeUrl(file.url);
            const safeName = escapeHtml(file.name);
            const time = file.messageTime?.toDate?.() || new Date(file.messageTime);
            const fileIcon = file.type.includes('pdf') ? 'file-text' : 'file';
            return `
              <div class="document-list-item">
                <div class="document-icon">
                  <i data-lucide="${fileIcon}"></i>
                </div>
                <div class="document-info">
                  <div class="document-name">${safeName}</div>
                  <div class="document-meta">${formatFileSize(file.size)} • ${formatTime(time)}</div>
                </div>
                <a href="${safeUrl}" download="${safeName}" class="btn-icon" title="Download">
                  <i data-lucide="download"></i>
                </a>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  documentsList.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();

  // Add click handlers for images
  const imageElements = documentsList.querySelectorAll('.document-image img');
  imageElements.forEach(img => {
    img.addEventListener('click', function() {
      window.open(this.dataset.url, '_blank');
    });
  });
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  unsubscribers.forEach(unsub => unsub());
});
