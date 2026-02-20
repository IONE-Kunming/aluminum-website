// Chat Service - Firebase Realtime Database
// Handles conversations, messages, file uploads for marketplace chat

import { escapeHtml } from './utils.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MESSAGE_LIMIT = 50;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_PDF_TYPES = ['application/pdf'];

class ChatService {
  constructor() {
    this.db = null;
    this.storage = null;
    this.auth = null;
    this._listeners = new Map(); // Track listeners to prevent duplicates
    this._initialized = false;
  }

  /** Initialize Firebase Realtime Database and Storage references */
  init() {
    if (this._initialized) return;
    const fb = window.firebase;
    if (!fb) throw new Error('Firebase not loaded');
    this.db = fb.database();
    this.storage = fb.storage();
    this.auth = fb.auth();
    this._initialized = true;
  }

  /** Get current authenticated user UID */
  _getUid() {
    const user = this.auth?.currentUser;
    if (!user) throw new Error('Not authenticated');
    return user.uid;
  }

  /**
   * Generate a deterministic conversation ID
   * Format: productId_buyerUid_sellerUid
   */
  getConversationId(productId, buyerId, sellerId) {
    return `${productId}_${buyerId}_${sellerId}`;
  }

  /**
   * Get or create a conversation. Prevents duplicates using transaction.
   * Returns the conversationId.
   */
  async getOrCreateConversation(productId, buyerId, sellerId) {
    this.init();
    const conversationId = this.getConversationId(productId, buyerId, sellerId);
    const convRef = this.db.ref(`conversations/${conversationId}`);

    // Use transaction to prevent duplicate creation
    await convRef.transaction((current) => {
      if (current) return; // Already exists, abort write
      return {
        productId,
        buyerId,
        sellerId,
        lastMessage: '',
        lastMessageAt: Date.now()
      };
    });

    // Ensure userConversations entries exist for both users
    const uid = this._getUid();
    const otherUserId = uid === buyerId ? sellerId : buyerId;

    const updates = {};
    updates[`userConversations/${buyerId}/${conversationId}`] = {
      otherUserId: sellerId,
      productId,
      lastMessage: '',
      lastMessageAt: Date.now()
    };
    updates[`userConversations/${sellerId}/${conversationId}`] = {
      otherUserId: buyerId,
      productId,
      lastMessage: '',
      lastMessageAt: Date.now()
    };
    // Only set if not exists — use update per path
    const buyerSnap = await this.db.ref(`userConversations/${buyerId}/${conversationId}`).once('value');
    if (!buyerSnap.exists()) {
      await this.db.ref(`userConversations/${buyerId}/${conversationId}`).set(updates[`userConversations/${buyerId}/${conversationId}`]);
    }
    const sellerSnap = await this.db.ref(`userConversations/${sellerId}/${conversationId}`).once('value');
    if (!sellerSnap.exists()) {
      await this.db.ref(`userConversations/${sellerId}/${conversationId}`).set(updates[`userConversations/${sellerId}/${conversationId}`]);
    }

    return conversationId;
  }

  /**
   * Send a text message to a conversation.
   * Updates lastMessage/lastMessageAt in conversation and both user inboxes.
   */
  async sendTextMessage(conversationId, text) {
    this.init();
    const uid = this._getUid();
    const trimmed = text.trim();
    if (!trimmed) return;

    const msgRef = this.db.ref(`messages/${conversationId}`).push();
    const now = Date.now();
    const message = {
      senderId: uid,
      type: 'text',
      text: trimmed,
      createdAt: now
    };

    await msgRef.set(message);
    await this._updateLastMessage(conversationId, trimmed, now);
    return msgRef.key;
  }

  /**
   * Send a file message (image or pdf).
   * Uploads to Firebase Storage, then stores the message with fileUrl.
   * Returns { messageId, cancel } where cancel can abort upload.
   * onProgress(percent) callback for upload progress.
   */
  async sendFileMessage(conversationId, file, onProgress) {
    this.init();
    const uid = this._getUid();

    // Validate file
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isPdf = ALLOWED_PDF_TYPES.includes(file.type);
    if (!isImage && !isPdf) {
      throw new Error('INVALID_FILE_TYPE');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('FILE_TOO_LARGE');
    }

    const fileType = isImage ? 'image' : 'pdf';
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `chatFiles/${conversationId}/${timestamp}_${safeName}`;
    const storageRef = this.storage.ref(storagePath);

    // Compress image if possible (canvas-based, only for jpeg/png/webp)
    let uploadFile = file;
    if (isImage && file.size > 500 * 1024) {
      try {
        uploadFile = await this._compressImage(file);
      } catch {
        uploadFile = file; // Fallback to original if compression fails
      }
    }

    const uploadTask = storageRef.put(uploadFile, {
      contentType: file.type
    });

    // Track progress
    if (onProgress) {
      uploadTask.on('state_changed', (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress(percent);
      });
    }

    // Wait for upload to complete
    await uploadTask;
    const fileUrl = await storageRef.getDownloadURL();

    // Create message
    const msgRef = this.db.ref(`messages/${conversationId}`).push();
    const message = {
      senderId: uid,
      type: fileType,
      fileUrl,
      createdAt: timestamp
    };
    await msgRef.set(message);

    const lastText = fileType === 'image' ? '📷 Image' : '📄 PDF';
    await this._updateLastMessage(conversationId, lastText, timestamp);
    return msgRef.key;
  }

  /** Compress image using canvas (client-side) */
  _compressImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        // Limit max dimension to 1200px
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Compression failed'));
          },
          'image/jpeg',
          0.7
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Image load failed'));
      };
      img.src = url;
    });
  }

  /** Update lastMessage in conversation and both userConversations entries */
  async _updateLastMessage(conversationId, text, timestamp) {
    const convSnap = await this.db.ref(`conversations/${conversationId}`).once('value');
    const conv = convSnap.val();
    if (!conv) return;

    const updates = {};
    updates[`conversations/${conversationId}/lastMessage`] = text;
    updates[`conversations/${conversationId}/lastMessageAt`] = timestamp;
    updates[`userConversations/${conv.buyerId}/${conversationId}/lastMessage`] = text;
    updates[`userConversations/${conv.buyerId}/${conversationId}/lastMessageAt`] = timestamp;
    updates[`userConversations/${conv.sellerId}/${conversationId}/lastMessage`] = text;
    updates[`userConversations/${conv.sellerId}/${conversationId}/lastMessageAt`] = timestamp;

    await this.db.ref().update(updates);
  }

  /**
   * Listen for new messages in a conversation (real-time).
   * Loads last MESSAGE_LIMIT messages, then listens for new ones.
   * Prevents duplicate listeners per conversationId.
   * callback(message) is called for each new message.
   * Returns a cleanup function.
   */
  listenMessages(conversationId, callback) {
    this.init();

    // Prevent duplicate listeners
    if (this._listeners.has(conversationId)) {
      this.stopListening(conversationId);
    }

    const messagesRef = this.db
      .ref(`messages/${conversationId}`)
      .orderByChild('createdAt')
      .limitToLast(MESSAGE_LIMIT);

    const onChildAdded = messagesRef.on('child_added', (snap) => {
      const msg = snap.val();
      if (msg) {
        callback({ id: snap.key, ...msg });
      }
    });

    this._listeners.set(conversationId, { ref: messagesRef, event: 'child_added', callback: onChildAdded });

    return () => this.stopListening(conversationId);
  }

  /** Stop listening for messages on a conversation */
  stopListening(conversationId) {
    const listener = this._listeners.get(conversationId);
    if (listener) {
      listener.ref.off(listener.event);
      this._listeners.delete(conversationId);
    }
  }

  /** Stop all active listeners */
  stopAllListeners() {
    for (const [id] of this._listeners) {
      this.stopListening(id);
    }
  }

  /**
   * Get conversations for the current user, ordered by lastMessageAt.
   * Returns array of { conversationId, otherUserId, productId, lastMessage, lastMessageAt }
   */
  async getUserConversations() {
    this.init();
    const uid = this._getUid();
    const snap = await this.db
      .ref(`userConversations/${uid}`)
      .orderByChild('lastMessageAt')
      .once('value');

    const conversations = [];
    snap.forEach((child) => {
      conversations.push({ conversationId: child.key, ...child.val() });
    });
    // Reverse to get newest first
    return conversations.reverse();
  }

  /** Get conversation metadata */
  async getConversation(conversationId) {
    this.init();
    const snap = await this.db.ref(`conversations/${conversationId}`).once('value');
    return snap.val();
  }

  /** Fetch a user's display name from Firestore (cached) */
  async getUserDisplayName(uid) {
    if (!this._nameCache) this._nameCache = new Map();
    if (this._nameCache.has(uid)) return this._nameCache.get(uid);

    try {
      const doc = await window.firebase.firestore().collection('users').doc(uid).get();
      const data = doc.data();
      const name = data?.displayName || data?.firstName || uid.substring(0, 8);
      this._nameCache.set(uid, name);
      return name;
    } catch {
      return uid.substring(0, 8);
    }
  }
}

export default new ChatService();
