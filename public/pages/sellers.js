import { renderPageWithLayout } from '../js/layout.js';
import languageManager from '../js/language.js';
import dataService from '../js/dataService.js';
import authManager from '../js/auth.js';
import { escapeHtml } from '../js/utils.js';

export async function renderSellers() {
  const t = languageManager.t.bind(languageManager);
  
  // Fetch sellers from database
  const sellers = await dataService.getSellers();
  
  // Get current user to check if authenticated
  const currentUser = authManager.getCurrentUser();
  
  const content = `
    <div class="sellers-page">
      <div class="page-header">
        <h1>${t('sellers.title')}</h1>
        <p>${t('sellers.subtitle')}</p>
      </div>

      ${sellers.length === 0 ? `
        <div class="empty-state">
          <i data-lucide="store" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>${t('sellers.loading')}</h2>
          <p>${t('sellers.directory')}</p>
        </div>
      ` : `
        <div class="sellers-content">
          <div class="sellers-grid">
            ${sellers.map(seller => `
              <div class="seller-card card">
                <div class="seller-header">
                  <div class="seller-avatar">
                    <i data-lucide="store" style="width: 32px; height: 32px;"></i>
                  </div>
                  <div class="seller-info">
                    <h3>${escapeHtml(seller.displayName || seller.email || 'Unknown Seller')}</h3>
                    ${seller.companyName ? `<p class="seller-company">${escapeHtml(seller.companyName)}</p>` : ''}
                  </div>
                </div>
                <div class="seller-body">
                  ${seller.email ? `
                    <div class="seller-detail">
                      <i data-lucide="mail"></i>
                      <span>${escapeHtml(seller.email)}</span>
                    </div>
                  ` : ''}
                  ${seller.phoneNumber ? `
                    <div class="seller-detail">
                      <i data-lucide="phone"></i>
                      <span>${escapeHtml(seller.phoneNumber)}</span>
                    </div>
                  ` : ''}
                </div>
                ${currentUser ? `
                  <div class="seller-actions">
                    <button class="btn btn-primary btn-chat" data-seller-id="${seller.uid}" data-seller-name="${escapeHtml(seller.displayName || seller.email || 'Seller')}">
                      <i data-lucide="message-circle"></i> Chat with Seller
                    </button>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          <div class="chat-panel" id="chatPanel" style="display: none;">
            <div class="chat-sidebar" id="chatSidebar" style="display: none;">
              <div class="chat-sidebar-header">
                <h4>Conversations</h4>
              </div>
              <div class="chat-sidebar-list" id="chatSidebarList">
                <!-- Chat list will be populated here -->
              </div>
            </div>
            <div class="chat-main">
              <div class="chat-header">
                <button class="btn-toggle-sidebar" id="toggleSidebarBtn" style="display: none;">
                  <i data-lucide="users"></i>
                </button>
                <h3 id="chatSellerName">Chat</h3>
                <button class="btn-close-chat" id="closeChatBtn">
                  <i data-lucide="x"></i>
                </button>
              </div>
              <div class="chat-messages" id="chatMessages">
                <div class="chat-empty">
                  <i data-lucide="message-circle" style="width: 48px; height: 48px; opacity: 0.3;"></i>
                  <p>Start a conversation</p>
                </div>
              </div>
              <div class="chat-input">
                <input type="file" id="chatFileInput" accept="image/*,video/*,.pdf" style="display: none;" multiple />
                <button class="btn-attach" id="attachFileBtn" title="Attach files">
                  <i data-lucide="paperclip"></i>
                </button>
                <input type="text" id="chatMessageInput" placeholder="Type a message..." />
                <button class="btn-send" id="sendMessageBtn">
                  <i data-lucide="send"></i>
                </button>
              </div>
              <div class="chat-attachments" id="chatAttachments" style="display: none;"></div>
            </div>
          </div>
        </div>
      `}
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  if (window.lucide) window.lucide.createIcons();
  
  // Initialize chat functionality if user is authenticated
  if (currentUser && sellers.length > 0) {
    initializeChat();
  }
}

// Initialize chat functionality
function initializeChat() {
  let currentChatSellerId = null;
  let selectedFiles = [];
  let unsubscribeMessages = null;
  let allChats = [];
  
  const chatPanel = document.getElementById('chatPanel');
  const chatSidebar = document.getElementById('chatSidebar');
  const chatSidebarList = document.getElementById('chatSidebarList');
  const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
  const chatMessages = document.getElementById('chatMessages');
  const chatSellerName = document.getElementById('chatSellerName');
  const chatMessageInput = document.getElementById('chatMessageInput');
  const sendMessageBtn = document.getElementById('sendMessageBtn');
  const closeChatBtn = document.getElementById('closeChatBtn');
  const attachFileBtn = document.getElementById('attachFileBtn');
  const chatFileInput = document.getElementById('chatFileInput');
  const chatAttachments = document.getElementById('chatAttachments');
  
  // Load user's chat list
  async function loadChatList() {
    try {
      allChats = await dataService.getUserChats();
      
      // Show sidebar only if user has more than 1 chat
      if (allChats.length > 1) {
        chatSidebar.style.display = 'block';
        toggleSidebarBtn.style.display = 'block';
        
        // Populate chat list
        chatSidebarList.innerHTML = allChats.map(chat => `
          <div class="chat-list-item ${chat.otherUserId === currentChatSellerId ? 'active' : ''}" 
               data-user-id="${chat.otherUserId}"
               data-user-name="${escapeHtml(chat.otherUser.displayName)}">
            <div class="chat-list-avatar">
              ${chat.otherUser.displayName.charAt(0).toUpperCase()}
            </div>
            <div class="chat-list-info">
              <div class="chat-list-name">${escapeHtml(chat.otherUser.displayName)}</div>
              <div class="chat-list-last-message">${escapeHtml(chat.lastMessage || 'No messages')}</div>
            </div>
          </div>
        `).join('');
        
        // Add click handlers to chat list items
        document.querySelectorAll('.chat-list-item').forEach(item => {
          item.addEventListener('click', async () => {
            const userId = item.dataset.userId;
            const userName = item.dataset.userName;
            
            currentChatSellerId = userId;
            chatSellerName.textContent = `Chat with ${userName}`;
            
            // Update active state
            document.querySelectorAll('.chat-list-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Load messages
            await loadChatMessages(userId);
          });
        });
        
        if (window.lucide) window.lucide.createIcons();
      } else {
        chatSidebar.style.display = 'none';
        toggleSidebarBtn.style.display = 'none';
      }
    } catch (error) {
      console.error('Error loading chat list:', error);
    }
  }
  
  // Toggle sidebar visibility
  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', () => {
      const isVisible = chatSidebar.style.display !== 'none';
      chatSidebar.style.display = isVisible ? 'none' : 'block';
    });
  }
  
  // Open chat with seller
  document.querySelectorAll('.btn-chat').forEach(btn => {
    btn.addEventListener('click', async () => {
      const sellerId = btn.dataset.sellerId;
      const sellerName = btn.dataset.sellerName;
      
      currentChatSellerId = sellerId;
      chatSellerName.textContent = `Chat with ${sellerName}`;
      chatPanel.style.display = 'flex';
      
      // Load chat list to check if sidebar should be shown
      await loadChatList();
      
      // Load chat messages
      await loadChatMessages(sellerId);
    });
  });
  
  // Close chat
  closeChatBtn.addEventListener('click', () => {
    chatPanel.style.display = 'none';
    currentChatSellerId = null;
    selectedFiles = [];
    chatAttachments.style.display = 'none';
    chatAttachments.innerHTML = '';
    
    // Unsubscribe from real-time updates
    if (unsubscribeMessages) {
      unsubscribeMessages();
      unsubscribeMessages = null;
    }
  });
  
  // Attach files
  attachFileBtn.addEventListener('click', () => {
    chatFileInput.click();
  });
  
  chatFileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf'];
    
    // Validate each file
    const validFiles = [];
    const errors = [];
    
    files.forEach(file => {
      if (file.size > maxSize) {
        errors.push(`${file.name} exceeds 10MB limit`);
      } else if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name} is not a supported file type`);
      } else {
        validFiles.push(file);
      }
    });
    
    // Show errors if any
    if (errors.length > 0) {
      window.toast?.error(`Some files were skipped:\n${errors.join('\n')}`);
    }
    
    selectedFiles = [...selectedFiles, ...validFiles];
    displayAttachments();
  });
  
  // Send message
  const sendMessage = async () => {
    const message = chatMessageInput.value.trim();
    
    if (!message && selectedFiles.length === 0) return;
    if (!currentChatSellerId) return;
    
    sendMessageBtn.disabled = true;
    
    try {
      await dataService.sendChatMessage({
        sellerId: currentChatSellerId,
        message: message,
        files: selectedFiles
      });
      
      chatMessageInput.value = '';
      selectedFiles = [];
      chatAttachments.style.display = 'none';
      chatAttachments.innerHTML = '';
      chatFileInput.value = '';
      
    } catch (error) {
      console.error('Error sending message:', error);
      window.toast?.error('Failed to send message');
    } finally {
      sendMessageBtn.disabled = false;
    }
  };
  
  sendMessageBtn.addEventListener('click', sendMessage);
  chatMessageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // Display selected attachments
  function displayAttachments() {
    if (selectedFiles.length === 0) {
      chatAttachments.style.display = 'none';
      return;
    }
    
    chatAttachments.style.display = 'flex';
    chatAttachments.innerHTML = selectedFiles.map((file, index) => `
      <div class="attachment-preview">
        <div class="attachment-info">
          <i data-lucide="${getFileIcon(file.type)}"></i>
          <span>${escapeHtml(file.name)}</span>
        </div>
        <button class="btn-remove-attachment" data-index="${index}">
          <i data-lucide="x"></i>
        </button>
      </div>
    `).join('');
    
    if (window.lucide) window.lucide.createIcons();
    
    // Remove attachment handlers
    document.querySelectorAll('.btn-remove-attachment').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        selectedFiles.splice(index, 1);
        displayAttachments();
      });
    });
  }
  
  // Get file icon based on type
  function getFileIcon(type) {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.includes('pdf')) return 'file-text';
    return 'file';
  }
  
  // Load chat messages
  async function loadChatMessages(sellerId) {
    try {
      // Unsubscribe from previous chat if any
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
      
      // Subscribe to real-time messages
      unsubscribeMessages = await dataService.subscribeToChatMessages(sellerId, (messages) => {
        displayMessages(messages);
      });
      
    } catch (error) {
      console.error('Error loading messages:', error);
      chatMessages.innerHTML = `
        <div class="chat-error">
          <i data-lucide="alert-circle"></i>
          <p>Failed to load messages</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  }
  
  // Display messages
  function displayMessages(messages) {
    console.log('displayMessages called with', messages.length, 'messages');
    
    if (messages.length === 0) {
      chatMessages.innerHTML = `
        <div class="chat-empty">
          <i data-lucide="message-circle" style="width: 48px; height: 48px; opacity: 0.3;"></i>
          <p>Start a conversation</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }
    
    const currentUser = authManager.getCurrentUser();
    console.log('Current user:', currentUser?.uid);
    
    chatMessages.innerHTML = messages.map(msg => {
      console.log('Rendering message:', msg.id, msg.message, msg.senderId);
      const isOwn = msg.senderId === currentUser.uid;
      const timestamp = msg.createdAt ? (msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt)) : new Date();
      
      return `
        <div class="chat-message ${isOwn ? 'own' : 'other'}">
          <div class="message-content">
            ${msg.message ? `<p>${escapeHtml(msg.message)}</p>` : ''}
            ${msg.attachments && msg.attachments.length > 0 ? `
              <div class="message-attachments">
                ${msg.attachments.map(att => `
                  <a href="${att.url}" target="_blank" class="message-attachment">
                    <i data-lucide="${getFileIcon(att.type)}"></i>
                    <span>${escapeHtml(att.name)}</span>
                  </a>
                `).join('')}
              </div>
            ` : ''}
          </div>
          <div class="message-time">${timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      `;
    }).join('');
    
    if (window.lucide) window.lucide.createIcons();
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    console.log('Messages displayed, scrolled to bottom');
  }
}
