import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import languageManager from '../js/language.js';
import translationService from '../js/translationService.js';
import { escapeHtml, sanitizeUrl } from '../js/utils.js';

let unsubscribers = [];
let sendingMessages = new Set(); // Track messages being sent
let tempMessageCounter = 0; // Counter for unique message IDs

export async function renderSellerChats() {
  const profile = authManager.getUserProfile();
  const t = languageManager.t.bind(languageManager);
  
  const content = `
    <div class="chats-page">
      <div class="page-header">
        <h1>${t('chats.title') || 'Chats'}</h1>
        <p>${t('chats.subtitle') || 'Your conversations with buyers'}</p>
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
                  <h4 id="chat-user-name">Buyer Name</h4>
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
let currentBuyerId = null;
let allMessages = []; // Store all messages for document extraction
let renderedMessageIds = new Set(); // Track which messages are already rendered

// Constants
const SCROLL_BOTTOM_THRESHOLD = 100; // Pixels from bottom to consider "at bottom"

async function loadChats() {
  try {
    const chats = await dataService.getUserChats();
    const chatsList = document.getElementById('chats-list');
    
    if (!chats || chats.length === 0) {
      chatsList.innerHTML = `
        <div class="empty-state">
          <i data-lucide="message-circle" style="width: 48px; height: 48px;"></i>
          <p>No conversations yet</p>
          <p class="text-muted">Buyers will reach out to you about your products</p>
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
      const safeCompany = chat.otherUserCompany ? escapeHtml(chat.otherUserCompany) : '';
      const safeLastMessage = escapeHtml(chat.lastMessage || 'No messages yet');
      const role = chat.otherUserRole || 'buyer';
      const roleLabel = role === 'buyer' ? 'Buyer' : role.charAt(0).toUpperCase() + role.slice(1);
      
      return `
        <div class="chat-item" data-chat-id="${chat.id}" data-buyer-id="${chat.otherUserId}" data-buyer-name="${safeName}" data-buyer-company="${safeCompany}">
          <div class="chat-avatar">${avatarLetter}</div>
          <div class="chat-info">
            <div class="chat-name">
              ${safeName}
              <span class="chat-role-badge" style="font-size: 0.75rem; color: var(--text-muted); margin-left: 4px;">${roleLabel}</span>
            </div>
            ${safeCompany ? `<div class="chat-company" style="font-size: 0.8rem; color: var(--text-muted);">${safeCompany}</div>` : ''}
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
      const buyerId = chatItem.dataset.buyerId;
      const chatId = chatItem.dataset.chatId;
      const buyerName = chatItem.dataset.buyerName || 'Buyer';
      const buyerCompany = chatItem.dataset.buyerCompany || '';
      selectChat(chatId, buyerId, buyerName, buyerCompany);
      
      // Mark as active
      document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
      chatItem.classList.add('active');
    }
  });
  
  // Handle send message
  sendBtn?.addEventListener('click', sendMessage);
  messageInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent form submission or other default behavior
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

async function selectChat(chatId, buyerId, buyerName, buyerCompany = '') {
  currentChatId = chatId;
  currentBuyerId = buyerId;
  
  console.log('[Seller Chat] Selected chat:', { chatId, buyerId, buyerName, buyerCompany });
  console.log('[Seller Chat] This chatId will be used for ALL messages in this conversation');
  
  // Update chat header with buyer info
  const displayName = buyerName || 'Buyer';
  const chatUserName = document.getElementById('chat-user-name');
  const chatUserStatus = document.getElementById('chat-user-status');
  const chatUserAvatar = document.getElementById('chat-user-avatar');
  
  if (chatUserName) chatUserName.textContent = displayName;
  if (chatUserAvatar) chatUserAvatar.textContent = displayName.charAt(0).toUpperCase();
  
  // Show company name as status/subtitle if available
  if (chatUserStatus && buyerCompany) {
    chatUserStatus.textContent = buyerCompany;
  } else if (chatUserStatus) {
    chatUserStatus.textContent = 'Online';
  }
  
  // Show chat window
  document.getElementById('chat-window-placeholder').style.display = 'none';
  document.getElementById('chat-window').style.display = 'flex';
  
  // Load messages
  loadMessages(buyerId);
}

async function loadMessages(buyerId) {
  const messagesContainer = document.getElementById('chat-messages');
  messagesContainer.innerHTML = '<div class="loading">Loading messages...</div>';
  
  console.log('[Seller Chat] Loading messages for buyer:', buyerId);
  
  // Unsubscribe from previous chat
  unsubscribers.forEach(unsub => unsub());
  unsubscribers = [];
  
  // Reset rendered messages tracking
  renderedMessageIds.clear();
  
  try {
    console.log('[Seller Chat] Subscribing to chat messages...');
    const unsubscribe = await dataService.subscribeToSellerChatMessages(buyerId, (messages) => {
      console.log('[Seller Chat] Received messages update:', messages.length, 'messages');
      displayMessages(messages);
    });
    unsubscribers.push(unsubscribe);
    console.log('[Seller Chat] Successfully subscribed to messages');
  } catch (error) {
    console.error('[Seller Chat] Error loading messages:', error);
    messagesContainer.innerHTML = `<div class="error">Failed to load messages: ${error.message}</div>`;
  }
}

function displayMessages(messages) {
  console.log('[Seller Chat] displayMessages called with', messages.length, 'messages');
  
  const messagesContainer = document.getElementById('chat-messages');
  const currentUser = authManager.getCurrentUser();
  
  if (!currentUser) {
    console.error('[Seller Chat] No current user found');
    messagesContainer.innerHTML = '<div class="error">User not authenticated</div>';
    return;
  }
  
  console.log('[Seller Chat] Current user:', currentUser.uid);
  
  // Store messages for document extraction
  allMessages = messages;
  updateDocumentsSidebar();
  
  if (!messages || messages.length === 0) {
    console.log('[Seller Chat] No messages to display');
    messagesContainer.innerHTML = '<div class="empty-state">No messages yet. Start the conversation!</div>';
    renderedMessageIds.clear();
    return;
  }
  
  console.log('[Seller Chat] Rendering', messages.length, 'messages');
  
  // Check if this is a fresh load (no messages rendered yet)
  const isFreshLoad = renderedMessageIds.size === 0;
  
  // Save scroll position
  const wasAtBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop <= messagesContainer.clientHeight + SCROLL_BOTTOM_THRESHOLD;
  
  // On fresh load, clear the container completely
  if (isFreshLoad) {
    console.log('[Seller Chat] Fresh load - clearing container');
    messagesContainer.innerHTML = '';
  }
  
  // Remove any temporary "sending" messages when real messages arrive
  // This prevents accumulation and handles the case where real messages arrive during the timeout
  if (messages.length > 0) {
    const tempMessages = messagesContainer.querySelectorAll('[data-temp-id]');
    tempMessages.forEach(tempMsg => {
      const tempId = tempMsg.getAttribute('data-temp-id');
      if (sendingMessages.has(tempId)) {
        sendingMessages.delete(tempId);
        tempMsg.remove();
        console.log('[Seller Chat] Removed temp message:', tempId);
      }
    });
  }
  
  console.log('[Seller Chat] Rendering messages. Already rendered:', renderedMessageIds.size, 'New:', messages.length);
  
  // Only render new messages (incremental update for better performance)
  let newMessagesCount = 0;
  messages.forEach((msg, index) => {
    if (renderedMessageIds.has(msg.id)) {
      return; // Skip already rendered messages
    }
    
    console.log('[Seller Chat] Rendering new message:', msg.id, 'from:', msg.senderId, 'isOwn:', msg.senderId === currentUser?.uid);
    newMessagesCount++;
    
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
    
    // Get current user's preferred language
    const userProfile = authManager.getUserProfile();
    const userLanguage = userProfile?.preferredLanguage || 'en';
    const messageLanguage = msg.originalLanguage || 'en';
    
    // Show translate button if message is in a different language
    const showTranslateButton = messageLanguage !== userLanguage && safeMessage;
    
    const messageHtml = `
      <div class="message ${isOwn ? 'message-own' : 'message-other'}" data-message-id="${msg.id}" data-original-language="${messageLanguage}">
        <div class="message-content">
          ${safeMessage ? `<div class="message-text" data-original-text="${msg.message}">${safeMessage}</div>` : ''}
          ${showTranslateButton ? `
            <button class="btn-translate" data-message-id="${msg.id}" title="Translate">
              <i data-lucide="languages" style="width: 14px; height: 14px;"></i>
              Translate
            </button>
          ` : ''}
          ${attachmentsHtml}
          <div class="message-time">${timeStr}</div>
        </div>
      </div>
    `;
    
    // Create temp element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = messageHtml;
    const messageElement = tempDiv.firstElementChild;
    
    // Since messages are already sorted, just append new messages to the end
    // (Real-time updates typically add at the end, and messages array is pre-sorted)
    messagesContainer.appendChild(messageElement);
    
    // Add click handler for images
    const images = messageElement.querySelectorAll('.attachment-image');
    images.forEach(img => {
      img.addEventListener('click', function() {
        window.open(this.dataset.url, '_blank');
      });
    });
    
    // Add click handler for translate button
    const translateBtn = messageElement.querySelector('.btn-translate');
    if (translateBtn) {
      translateBtn.addEventListener('click', async function() {
        await handleTranslateMessage(this);
      });
    }
    
    renderedMessageIds.add(msg.id);
  });
  
  console.log('[Seller Chat] Rendered', newMessagesCount, 'new messages. Total rendered:', renderedMessageIds.size);
  
  // Initialize lucide icons for new elements only
  if (window.lucide) window.lucide.createIcons();
  
  // Scroll to bottom if user was at bottom or if fresh load
  if (wasAtBottom || isFreshLoad) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

async function handleTranslateMessage(button) {
  const messageElement = button.closest('.message');
  const messageTextElement = messageElement.querySelector('.message-text');
  const originalText = messageTextElement.dataset.originalText;
  const originalLanguage = messageElement.dataset.originalLanguage || 'en';
  
  // Get user's preferred language
  const userProfile = authManager.getUserProfile();
  const targetLanguage = userProfile?.preferredLanguage || 'en';
  
  // Check if already translated
  if (button.classList.contains('translated')) {
    // Show original text
    messageTextElement.textContent = originalText;
    button.innerHTML = '<i data-lucide="languages" style="width: 14px; height: 14px;"></i> Translate';
    button.classList.remove('translated');
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  
  // Show loading state
  button.disabled = true;
  button.innerHTML = '<i data-lucide="loader-2" class="spin" style="width: 14px; height: 14px;"></i> Translating...';
  if (window.lucide) window.lucide.createIcons();
  
  try {
    const translatedText = await translationService.translateText(
      originalText,
      originalLanguage,
      targetLanguage
    );
    
    if (translatedText) {
      messageTextElement.textContent = translatedText;
      button.innerHTML = '<i data-lucide="languages" style="width: 14px; height: 14px;"></i> Show Original';
      button.classList.add('translated');
    } else {
      window.toast?.error('Translation failed. Please try again.');
      button.innerHTML = '<i data-lucide="languages" style="width: 14px; height: 14px;"></i> Translate';
    }
  } catch (error) {
    console.error('Translation error:', error);
    window.toast?.error('Translation failed. Please try again.');
    button.innerHTML = '<i data-lucide="languages" style="width: 14px; height: 14px;"></i> Translate';
  } finally {
    button.disabled = false;
    if (window.lucide) window.lucide.createIcons();
  }
}

async function sendMessage() {
  const messageInput = document.getElementById('chat-message-input');
  const message = messageInput?.value?.trim();
  
  console.log('[Seller Chat] sendMessage called:', { message, filesCount: selectedFiles.length, buyerId: currentBuyerId });
  
  if (!message && selectedFiles.length === 0) {
    console.log('[Seller Chat] No message or files to send');
    return;
  }
  
  if (!currentBuyerId) {
    console.error('[Seller Chat] No buyer selected');
    window.toast?.error('Please select a chat first');
    return;
  }
  
  console.log('[Seller Chat] Sending message to buyer:', currentBuyerId);
  
  // Optimistically clear input and show message immediately
  const tempMessage = message;
  const tempFiles = [...selectedFiles];
  messageInput.value = '';
  selectedFiles = [];
  displaySelectedFiles();
  
  // Clear file input
  const fileInput = document.getElementById('chat-file-input');
  if (fileInput) fileInput.value = '';
  
  // Add temporary message to UI for immediate feedback
  const messagesContainer = document.getElementById('chat-messages');
  const currentUser = authManager.getCurrentUser();
  const userProfile = authManager.getUserProfile();
  
  // Generate unique ID for temp message
  const tempId = `temp_${Date.now()}_${++tempMessageCounter}`;
  sendingMessages.add(tempId);
  
  const tempMessageElement = document.createElement('div');
  tempMessageElement.className = 'message message-own message-sending';
  tempMessageElement.setAttribute('data-temp-id', tempId);
  tempMessageElement.innerHTML = `
    <div class="message-content">
      ${tempMessage ? `<div class="message-text">${escapeHtml(tempMessage)}</div>` : ''}
      ${tempFiles.length > 0 ? `<div class="message-attachments"><div class="attachment-file"><i data-lucide="file"></i> ${tempFiles.length} file(s) uploading...</div></div>` : ''}
      <div class="message-time">Sending...</div>
    </div>
  `;
  messagesContainer.appendChild(tempMessageElement);
  if (window.lucide) window.lucide.createIcons();
  
  // Scroll to bottom to show new message
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  try {
    console.log('[Seller Chat] Calling dataService.sendSellerChatMessage...');
    const result = await dataService.sendSellerChatMessage({
      buyerId: currentBuyerId,
      message: tempMessage,
      files: tempFiles
    });
    console.log('[Seller Chat] Message sent successfully:', result);
    
    // Fallback timeout to remove temp message if real message doesn't arrive
    // Real messages are cleaned up immediately when they arrive in displayMessages()
    setTimeout(() => {
      if (sendingMessages.has(tempId)) {
        sendingMessages.delete(tempId);
        console.log('[Seller Chat] Removing temp message after timeout');
        // Check if temp message still exists before removing
        if (tempMessageElement.parentNode) {
          tempMessageElement.remove();
        }
      }
    }, 5000);
    
  } catch (error) {
    console.error('Error sending message:', error);
    window.toast?.error('Failed to send message');
    
    // Remove temporary message and restore input
    sendingMessages.delete(tempId);
    tempMessageElement.remove();
    messageInput.value = tempMessage;
    selectedFiles = tempFiles;
    displaySelectedFiles();
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
