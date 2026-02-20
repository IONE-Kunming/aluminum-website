// Chat Page - Shared by buyers and sellers
// Renders conversation list and message window

import { renderPageWithLayout } from '../js/layout.js';
import authManager from '../js/auth.js';
import languageManager from '../js/language.js';
import chatService from '../js/chatService.js';
import { escapeHtml, sanitizeUrl } from '../js/utils.js';

// Track state to prevent re-entry
let _activeConversationId = null;
let _cleanupListener = null;
let _isSending = false;

export async function renderChat() {
  const profile = authManager.getUserProfile();
  const t = languageManager.t.bind(languageManager);

  const content = `
    <div class="chat-page">
      <div class="page-header">
        <h1>${t('chats.title')}</h1>
        <p>${t('chats.subtitle')}</p>
      </div>
      <div class="chat-container">
        <div class="chat-sidebar" id="chat-sidebar">
          <div class="chat-sidebar-header">
            <h3>${t('chats.conversations')}</h3>
          </div>
          <div class="chat-conversation-list" id="chat-conversation-list">
            <div class="chat-loading"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="chat-main" id="chat-main">
          <div class="chat-empty-state" id="chat-empty-state">
            <i data-lucide="message-circle" style="width:64px;height:64px;color:var(--text-tertiary);"></i>
            <p>${t('chats.selectChat')}</p>
          </div>
          <div class="chat-window" id="chat-window" style="display:none;">
            <div class="chat-window-header" id="chat-window-header"></div>
            <div class="chat-messages" id="chat-messages">
              <div class="chat-loading"><div class="spinner"></div></div>
            </div>
            <div class="chat-upload-progress" id="chat-upload-progress" style="display:none;">
              <div class="chat-progress-bar"><div class="chat-progress-fill" id="chat-progress-fill"></div></div>
              <span id="chat-progress-text">${t('chats.uploading')}</span>
            </div>
            <div class="chat-input-area" id="chat-input-area">
              <label class="chat-attach-btn" id="chat-attach-label" title="${t('chats.attachFile')}">
                <i data-lucide="paperclip"></i>
                <input type="file" id="chat-file-input" accept="image/jpeg,image/png,image/webp,application/pdf" style="display:none;" />
              </label>
              <input type="text" id="chat-text-input" class="chat-text-input" placeholder="${t('chats.typeMessage')}" autocomplete="off" />
              <button class="chat-send-btn" id="chat-send-btn" title="${t('chats.send')}">
                <i data-lucide="send"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Cleanup previous listeners
  if (_cleanupListener) {
    _cleanupListener();
    _cleanupListener = null;
  }
  _activeConversationId = null;
  _isSending = false;

  renderPageWithLayout(content, profile?.role);
  if (window.lucide) window.lucide.createIcons();

  // Load conversations
  await loadConversations(t, profile);
}

/** Load and render the conversation list */
async function loadConversations(t, profile) {
  const listEl = document.getElementById('chat-conversation-list');
  if (!listEl) return;

  try {
    chatService.init();
    const conversations = await chatService.getUserConversations();

    if (!conversations.length) {
      listEl.innerHTML = `
        <div class="chat-no-conversations">
          <i data-lucide="message-square" style="width:40px;height:40px;color:var(--text-tertiary);"></i>
          <p>${t('chats.noChats')}</p>
          <small>${t('chats.startChatting')}</small>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Resolve display names
    const namePromises = conversations.map(c => chatService.getUserDisplayName(c.otherUserId));
    const names = await Promise.all(namePromises);

    listEl.innerHTML = conversations.map((conv, i) => {
      const name = escapeHtml(names[i] || 'User');
      const lastMsg = escapeHtml(conv.lastMessage || '');
      const time = conv.lastMessageAt ? formatTime(conv.lastMessageAt) : '';
      return `
        <div class="chat-conversation-item" data-id="${escapeHtml(conv.conversationId)}">
          <div class="chat-conv-avatar">${name.charAt(0).toUpperCase()}</div>
          <div class="chat-conv-info">
            <div class="chat-conv-name">${name}</div>
            <div class="chat-conv-last">${lastMsg || t('chats.noMessages')}</div>
          </div>
          <div class="chat-conv-time">${time}</div>
        </div>
      `;
    }).join('');

    // Add click handlers
    listEl.querySelectorAll('.chat-conversation-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        openConversation(id, t, profile);
        // Mobile: show main, hide sidebar
        document.getElementById('chat-sidebar')?.classList.add('chat-sidebar-hidden');
        document.getElementById('chat-main')?.classList.add('chat-main-visible');
        // Mark active
        listEl.querySelectorAll('.chat-conversation-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
      });
    });

    if (window.lucide) window.lucide.createIcons();

    // Auto-open if conversationId is in URL
    const params = new URLSearchParams(window.location.search);
    const convId = params.get('id');
    if (convId) {
      openConversation(convId, t, profile);
      const target = listEl.querySelector(`[data-id="${convId}"]`);
      if (target) target.classList.add('active');
    }
  } catch (err) {
    console.error('[Chat] Failed to load conversations:', err);
    listEl.innerHTML = `<div class="chat-error"><p>${t('common.error')}</p></div>`;
  }
}

/** Open a conversation and start listening for messages */
async function openConversation(conversationId, t, profile) {
  // Cleanup previous
  if (_cleanupListener) {
    _cleanupListener();
    _cleanupListener = null;
  }
  _activeConversationId = conversationId;

  const emptyState = document.getElementById('chat-empty-state');
  const chatWindow = document.getElementById('chat-window');
  const messagesEl = document.getElementById('chat-messages');
  const headerEl = document.getElementById('chat-window-header');
  if (!chatWindow || !messagesEl || !headerEl) return;

  if (emptyState) emptyState.style.display = 'none';
  chatWindow.style.display = 'flex';
  messagesEl.innerHTML = `<div class="chat-loading"><div class="spinner"></div><p>${t('chats.loadingMessages')}</p></div>`;

  try {
    // Get conversation metadata
    const conv = await chatService.getConversation(conversationId);
    if (!conv) {
      messagesEl.innerHTML = `<div class="chat-error"><p>${t('common.error')}</p></div>`;
      return;
    }

    const uid = authManager.getCurrentUser()?.uid;
    const otherUid = uid === conv.buyerId ? conv.sellerId : conv.buyerId;
    const otherName = await chatService.getUserDisplayName(otherUid);

    // Render header with back button for mobile
    headerEl.innerHTML = `
      <button class="chat-back-btn" id="chat-back-btn" title="${t('common.back')}">
        <i data-lucide="arrow-left"></i>
      </button>
      <div class="chat-header-avatar">${escapeHtml(otherName).charAt(0).toUpperCase()}</div>
      <div class="chat-header-info">
        <div class="chat-header-name">${escapeHtml(otherName)}</div>
        <div class="chat-header-product">${t('chats.product')}: ${escapeHtml(conv.productId || '')}</div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    // Back button for mobile
    document.getElementById('chat-back-btn')?.addEventListener('click', () => {
      document.getElementById('chat-sidebar')?.classList.remove('chat-sidebar-hidden');
      document.getElementById('chat-main')?.classList.remove('chat-main-visible');
    });

    // Clear messages and start listening
    messagesEl.innerHTML = '';
    let hasMessages = false;
    const messageIds = new Set();

    _cleanupListener = chatService.listenMessages(conversationId, (msg) => {
      if (messageIds.has(msg.id)) return; // Deduplicate
      messageIds.add(msg.id);
      if (!hasMessages) {
        messagesEl.innerHTML = '';
        hasMessages = true;
      }
      appendMessage(msg, uid, t);
      scrollToBottom();
    });

    // Show empty state after brief delay if no messages arrive
    setTimeout(() => {
      if (!hasMessages && _activeConversationId === conversationId) {
        messagesEl.innerHTML = `<div class="chat-no-messages"><p>${t('chats.noMessages')}</p></div>`;
      }
    }, 1500);

    // Setup input handlers
    setupInputHandlers(conversationId, t);
  } catch (err) {
    console.error('[Chat] Failed to open conversation:', err);
    messagesEl.innerHTML = `<div class="chat-error"><p>${t('common.error')}</p></div>`;
  }
}

/** Append a single message to the chat window */
function appendMessage(msg, currentUid, t) {
  const messagesEl = document.getElementById('chat-messages');
  if (!messagesEl) return;

  const isOwn = msg.senderId === currentUid;
  const div = document.createElement('div');
  div.className = `chat-message ${isOwn ? 'chat-message-own' : 'chat-message-other'}`;

  const time = formatTime(msg.createdAt);
  let body = '';

  if (msg.type === 'text') {
    body = `<div class="chat-msg-text">${escapeHtml(msg.text || '')}</div>`;
  } else if (msg.type === 'image') {
    const safeUrl = sanitizeUrl(msg.fileUrl || '');
    body = safeUrl
      ? `<div class="chat-msg-image"><img src="${safeUrl}" alt="Image" loading="lazy" onclick="window.open('${safeUrl}','_blank')" /></div>`
      : `<div class="chat-msg-text">[Image]</div>`;
  } else if (msg.type === 'pdf') {
    const safeUrl = sanitizeUrl(msg.fileUrl || '');
    body = safeUrl
      ? `<div class="chat-msg-pdf"><a href="${safeUrl}" target="_blank" rel="noopener noreferrer"><i data-lucide="file-text"></i> ${t('chats.viewPdf')}</a></div>`
      : `<div class="chat-msg-text">[PDF]</div>`;
  }

  div.innerHTML = `
    <div class="chat-msg-bubble">
      ${body}
      <div class="chat-msg-time">${time}</div>
    </div>
  `;
  messagesEl.appendChild(div);

  if (window.lucide) window.lucide.createIcons();
}

/** Setup text input and file input handlers */
function setupInputHandlers(conversationId, t) {
  const textInput = document.getElementById('chat-text-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const fileInput = document.getElementById('chat-file-input');
  const progressEl = document.getElementById('chat-upload-progress');
  const progressFill = document.getElementById('chat-progress-fill');
  const progressText = document.getElementById('chat-progress-text');

  if (!textInput || !sendBtn) return;

  // Remove old listeners by replacing elements
  const newSendBtn = sendBtn.cloneNode(true);
  sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
  const newTextInput = textInput.cloneNode(true);
  textInput.parentNode.replaceChild(newTextInput, textInput);
  const newFileInput = fileInput ? fileInput.cloneNode(true) : null;
  if (fileInput && newFileInput) {
    fileInput.parentNode.replaceChild(newFileInput, fileInput);
  }

  // Send text
  async function handleSend() {
    if (_isSending) return;
    const text = newTextInput.value.trim();
    if (!text) return;

    _isSending = true;
    newSendBtn.disabled = true;
    newTextInput.value = '';

    try {
      await chatService.sendTextMessage(conversationId, text);
    } catch (err) {
      console.error('[Chat] Send failed:', err);
      if (window.toast) window.toast.error(t('chats.messageFailed'));
      newTextInput.value = text; // Restore on failure
    } finally {
      _isSending = false;
      newSendBtn.disabled = false;
      newTextInput.focus();
    }
  }

  newSendBtn.addEventListener('click', handleSend);
  newTextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // File upload
  if (newFileInput) {
    newFileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      newFileInput.value = ''; // Reset for re-selection

      // Validate
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
      const isPdf = ALLOWED_PDF_TYPES.includes(file.type);
      if (!isImage && !isPdf) {
        if (window.toast) window.toast.error(t('chats.invalidFileType'));
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        if (window.toast) window.toast.error(t('chats.fileTooLarge'));
        return;
      }

      // Show progress
      _isSending = true;
      newSendBtn.disabled = true;
      if (progressEl) progressEl.style.display = 'flex';
      if (progressFill) progressFill.style.width = '0%';
      if (progressText) progressText.textContent = t('chats.uploading');

      try {
        await chatService.sendFileMessage(conversationId, file, (percent) => {
          if (progressFill) progressFill.style.width = `${percent}%`;
          if (progressText) progressText.textContent = `${t('chats.uploading')} ${percent}%`;
        });
      } catch (err) {
        console.error('[Chat] Upload failed:', err);
        if (window.toast) window.toast.error(t('chats.uploadFailed'));
      } finally {
        _isSending = false;
        newSendBtn.disabled = false;
        if (progressEl) progressEl.style.display = 'none';
      }
    });
  }
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_PDF_TYPES = ['application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Scroll messages container to bottom */
function scrollToBottom() {
  const el = document.getElementById('chat-messages');
  if (el) {
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }
}

/** Format timestamp to short time */
function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
