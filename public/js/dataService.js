// Data Service - Provides API integration for real data
// This module handles all data fetching from backend/Firebase

import authManager from './auth.js';

class DataService {
  constructor() {
    this.db = null;
    this.initialized = false;
    // Add caching mechanism
    this.cache = {
      products: { data: null, timestamp: null, ttl: 60000 }, // 1 minute TTL
      categories: { data: null, timestamp: null, ttl: 300000 }, // 5 minutes TTL
    };
    // Constants
    this.ATTACHMENT_PLACEHOLDER = 'Attachment';
  }

  // Initialize Firestore connection
  async init() {
    if (this.initialized) return;
    
    // Wait for Firebase to be ready
    await this.waitForFirebase();
    
    if (window.firebase && window.firebase.firestore) {
      this.db = window.firebase.firestore();
      this.initialized = true;
      console.log('DataService initialized with Firestore');
    } else {
      console.warn('Firebase not available, using mock data');
    }
  }

  // Wait for Firebase to load
  waitForFirebase() {
    return new Promise((resolve) => {
      if (window.firebase) {
        resolve();
        return;
      }
      
      const checkFirebase = setInterval(() => {
        if (window.firebase) {
          clearInterval(checkFirebase);
          resolve();
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkFirebase);
        resolve();
      }, 5000);
    });
  }

  // Get user's dashboard stats
  async getDashboardStats(role) {
    await this.init();
    
    try {
      if (!this.db) {
        // Return mock data if Firestore not available
        return this.getMockDashboardStats(role);
      }

      const userId = authManager.getCurrentUser()?.uid;
      if (!userId) {
        return this.getMockDashboardStats(role);
      }

      // Fetch real data from Firestore based on role
      if (role === 'buyer') {
        return await this.getBuyerStats(userId);
      } else if (role === 'seller') {
        return await this.getSellerStats(userId);
      } else if (role === 'admin') {
        return await this.getAdminStats();
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return this.getMockDashboardStats(role);
    }
  }

  // Get buyer statistics
  async getBuyerStats(userId) {
    const ordersSnapshot = await this.db
      .collection('orders')
      .where('buyerId', '==', userId)
      .get();

    const orders = ordersSnapshot.docs.map(doc => doc.data());
    
    const totalOrders = orders.length;
    const activeOrders = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status?.toLowerCase())).length;
    const completedOrders = orders.filter(o => o.status?.toLowerCase() === 'delivered').length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    return {
      totalOrders,
      activeOrders,
      totalSpent,
      completedOrders
    };
  }

  // Get seller statistics
  async getSellerStats(userId) {
    const [productsSnapshot, ordersSnapshot] = await Promise.all([
      this.db.collection('products').where('sellerId', '==', userId).get(),
      this.db.collection('orders').where('sellerId', '==', userId).get()
    ]);

    const products = productsSnapshot.docs.map(doc => doc.data());
    const orders = ordersSnapshot.docs.map(doc => doc.data());

    const totalProducts = products.length;
    const totalOrders = orders.length;
    const activeOrders = orders.filter(o => ['pending', 'processing'].includes(o.status?.toLowerCase())).length;
    const revenue = orders
      .filter(o => o.status?.toLowerCase() === 'delivered')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    return {
      totalProducts,
      totalOrders,
      revenue,
      activeOrders
    };
  }

  // Get admin statistics
  async getAdminStats() {
    const [usersSnapshot, ordersSnapshot, sellersSnapshot] = await Promise.all([
      this.db.collection('users').get(),
      this.db.collection('orders').get(),
      this.db.collection('users').where('role', '==', 'seller').get()
    ]);

    const totalUsers = usersSnapshot.size;
    const totalOrders = ordersSnapshot.size;
    const activeSellers = sellersSnapshot.size;
    const revenue = ordersSnapshot.docs
      .map(doc => doc.data())
      .reduce((sum, order) => sum + (order.total || 0), 0);

    return {
      totalUsers,
      totalOrders,
      revenue,
      activeSellers
    };
  }

  // Get recent orders for buyer
  async getRecentOrders(userId, limit = 10) {
    await this.init();

    try {
      if (!this.db || !userId) {
        return [];
      }

      const snapshot = await this.db
        .collection('orders')
        .where('buyerId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      return [];
    }
  }

  // Get top products for seller
  async getTopProducts(userId, limit = 10) {
    await this.init();

    try {
      if (!this.db || !userId) {
        return [];
      }

      const snapshot = await this.db
        .collection('products')
        .where('sellerId', '==', userId)
        .orderBy('sales', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching top products:', error);
      return [];
    }
  }

  // Helper method to determine if cache should be used
  shouldUseCache(filters) {
    return !filters.category && !filters.sellerId && !filters.limit;
  }

  // Get products from catalog with caching and pagination
  async getProducts(filters = {}) {
    await this.init();

    try {
      if (!this.db) {
        return [];
      }

      // Check cache if no specific filters and cache is fresh
      if (this.shouldUseCache(filters)) {
        const cached = this.cache.products;
        if (cached.data && cached.timestamp && (Date.now() - cached.timestamp < cached.ttl)) {
          return cached.data;
        }
      }

      let query = this.db.collection('products');

      // Apply filters
      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }
      if (filters.sellerId) {
        query = query.where('sellerId', '==', filters.sellerId);
      }
      
      // Apply pagination limit (default to 50 for better performance)
      const limit = filters.limit || 50;
      query = query.limit(limit);

      const snapshot = await query.get();
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort in memory to avoid Firestore index requirements
      products.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date();
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date();
        return dateB - dateA; // descending order
      });
      
      // Cache results if no specific filters
      if (this.shouldUseCache(filters)) {
        this.cache.products = {
          data: products,
          timestamp: Date.now(),
          ttl: 60000
        };
      }
      
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  // Clear cache manually if needed
  clearCache(key = null) {
    if (key) {
      if (this.cache[key]) {
        this.cache[key] = { data: null, timestamp: null, ttl: this.cache[key].ttl };
      }
    } else {
      // Clear all caches
      Object.keys(this.cache).forEach(k => {
        this.cache[k].data = null;
        this.cache[k].timestamp = null;
      });
    }
  }

  // Add a new product
  async addProduct(productData) {
    await this.init();

    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const user = authManager.getCurrentUser();
      const profile = authManager.getUserProfile();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create product document with seller information
      const product = {
        sellerId: user.uid,
        sellerName: profile?.displayName || user.email || 'Seller',
        modelNumber: productData.modelNumber,
        category: productData.category,
        pricePerMeter: parseFloat(productData.pricePerMeter),
        description: productData.description || '',
        stock: parseInt(productData.stock) || 0,
        imageUrl: productData.imageUrl || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await this.db.collection('products').add(product);
      
      // Clear products cache when new product is added
      this.clearCache('products');
      
      return { success: true, id: docRef.id, product };
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }

  // Delete a product
  async deleteProduct(productId) {
    await this.init();

    try {
      if (!this.db || !productId) {
        throw new Error('Invalid product ID or database not initialized');
      }

      await this.db.collection('products').doc(productId).delete();
      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Update an existing product
  async updateProduct(productId, productData) {
    await this.init();

    try {
      if (!this.db || !productId) {
        throw new Error('Invalid product ID or database not initialized');
      }

      // Add updated timestamp
      const updateData = {
        ...productData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await this.db.collection('products').doc(productId).update(updateData);
      
      return { 
        success: true,
        productId: productId
      };
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // Get unique categories from products
  async getCategories(sellerId = null) {
    await this.init();

    try {
      if (!this.db) {
        return [];
      }

      let query = this.db.collection('products');
      
      // If sellerId provided, only get that seller's categories
      if (sellerId) {
        query = query.where('sellerId', '==', sellerId);
      }

      const snapshot = await query.get();
      
      // Extract unique categories
      const categoriesSet = new Set();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.category) {
          categoriesSet.add(data.category);
        }
      });
      
      // Convert to array and sort alphabetically
      return Array.from(categoriesSet).sort();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Delete products by category
  async deleteProductsByCategory(category, sellerId) {
    await this.init();

    try {
      if (!this.db || !category) {
        throw new Error('Invalid category or database not initialized');
      }

      // Build query
      let query = this.db.collection('products').where('category', '==', category);
      
      // If sellerId provided, only delete that seller's products
      if (sellerId) {
        query = query.where('sellerId', '==', sellerId);
      }

      const snapshot = await query.get();
      
      if (snapshot.empty) {
        return { success: true, deletedCount: 0 };
      }

      // Delete all matching products in a batch
      const batch = this.db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      return { success: true, deletedCount: snapshot.size };
    } catch (error) {
      console.error('Error deleting products by category:', error);
      throw error;
    }
  }

  // Mock data fallback methods
  getMockDashboardStats(role) {
    if (role === 'buyer') {
      return {
        totalOrders: 0,
        activeOrders: 0,
        totalSpent: 0,
        completedOrders: 0
      };
    } else if (role === 'seller') {
      return {
        totalProducts: 0,
        totalOrders: 0,
        revenue: 0,
        activeOrders: 0
      };
    } else if (role === 'admin') {
      return {
        totalUsers: 0,
        totalOrders: 0,
        revenue: 0,
        activeSellers: 0
      };
    }
    return {};
  }

  // Create a new order
  async createOrder(orderData) {
    await this.init();
    
    try {
      if (!this.db) {
        console.error('Firestore not initialized when trying to create order');
        throw new Error('Unable to connect to the database. Please try again or contact support.');
      }
      
      console.log('Creating order with data:', {
        buyerId: orderData.buyerId,
        sellerId: orderData.sellerId,
        itemsCount: orderData.items?.length,
        total: orderData.total
      });
      
      const orderRef = await this.db.collection('orders').add(orderData);
      
      console.log('Order created successfully with ID:', orderRef.id);
      
      return {
        success: true,
        orderId: orderRef.id
      };
    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Order data that failed:', orderData);
      throw error;
    }
  }

  // Create multiple orders atomically using Firestore batched writes
  async createOrdersBatch(ordersData) {
    await this.init();
    
    try {
      if (!this.db) {
        console.error('Firestore not initialized when trying to create orders');
        throw new Error('Unable to connect to the database. Please try again or contact support.');
      }
      
      // Validate input
      if (!ordersData || ordersData.length === 0) {
        console.error('No orders data provided to createOrdersBatch');
        throw new Error('No orders to create');
      }
      
      console.log('Creating batch of orders:', {
        count: ordersData.length,
        buyerId: ordersData[0].buyerId
      });
      
      // Use Firestore batched write for atomicity
      const batch = this.db.batch();
      const orderIds = [];
      
      ordersData.forEach(orderData => {
        const orderRef = this.db.collection('orders').doc();
        batch.set(orderRef, orderData);
        orderIds.push(orderRef.id);
        
        console.log('Adding order to batch:', {
          orderId: orderRef.id,
          sellerId: orderData.sellerId,
          itemsCount: orderData.items?.length,
          total: orderData.total
        });
      });
      
      // Commit all orders atomically
      await batch.commit();
      
      console.log('All orders created successfully:', orderIds);
      
      return {
        success: true,
        orderIds: orderIds
      };
    } catch (error) {
      console.error('Error creating orders batch:', error);
      console.error('Failed to create orders');
      throw error;
    }
  }

  // Get orders for a specific user
  async getOrders(filters = {}) {
    await this.init();
    
    try {
      if (!this.db) {
        return [];
      }
      
      let query = this.db.collection('orders');
      
      // Apply filters
      if (filters.buyerId) {
        query = query.where('buyerId', '==', filters.buyerId);
      }
      
      if (filters.sellerId) {
        query = query.where('sellerId', '==', filters.sellerId);
      }
      
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }
      
      // Try to order by creation date descending
      try {
        const orderedQuery = query.orderBy('createdAt', 'desc');
        const snapshot = await orderedQuery.get();
        
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (indexError) {
        // If index error, try without orderBy
        console.warn('Firestore index not available, fetching without ordering:', indexError);
        const snapshot = await query.get();
        
        // Sort in memory
        const orders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort by createdAt, putting orders without timestamps at the end
        orders.sort((a, b) => {
          // Handle Firestore Timestamp objects properly
          const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
          const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
          return dateB - dateA;
        });
        
        return orders;
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  // Get a single product by ID
  async getProductById(productId) {
    await this.init();
    
    try {
      if (!this.db || !productId) {
        return null;
      }
      
      const doc = await this.db.collection('products').doc(productId).get();
      
      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  // Validate multiple products exist in the database
  async validateProducts(productIds) {
    await this.init();
    
    try {
      if (!this.db || !productIds || productIds.length === 0) {
        return {};
      }
      
      const validationResults = {};
      
      // Fetch all products in parallel
      const promises = productIds.map(async (id) => {
        const product = await this.getProductById(id);
        validationResults[id] = product !== null;
      });
      
      await Promise.all(promises);
      
      return validationResults;
    } catch (error) {
      console.error('Error validating products:', error);
      return {};
    }
  }

  // Get all sellers from the database
  async getSellers() {
    await this.init();
    
    try {
      if (!this.db) {
        return [];
      }
      
      // Query users collection for users with role 'seller'
      const snapshot = await this.db
        .collection('users')
        .where('role', '==', 'seller')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching sellers:', error);
      return [];
    }
  }

  // Send a chat message
  async sendChatMessage({ sellerId, message, files = [] }) {
    await this.init();
    
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      
      const currentUser = authManager.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const buyerId = currentUser.uid;
      
      // Create chat conversation ID (consistent ordering: buyer_seller)
      const chatId = [buyerId, sellerId].sort().join('_');
      
      // Upload files if any (in parallel for better performance)
      const attachments = [];
      if (files.length > 0) {
        console.log(`[Buyer] Uploading ${files.length} files...`);
        const uploadPromises = files.map(file => 
          this.uploadChatFile(chatId, file)
            .catch(error => {
              console.error('Error uploading file:', file.name, error);
              window.toast?.error(`Failed to upload: ${file.name}`);
              return null; // Return null for failed uploads
            })
        );
        const results = await Promise.all(uploadPromises);
        // Filter out failed uploads (null values)
        const successfulUploads = results.filter(att => att !== null);
        attachments.push(...successfulUploads);
        
        const failedCount = files.length - successfulUploads.length;
        if (failedCount > 0) {
          console.warn(`${failedCount} file(s) failed to upload`);
        }
        if (successfulUploads.length > 0) {
          console.log(`${successfulUploads.length} file(s) uploaded successfully`);
        }
      }
      
      // Get sender's preferred language from their profile
      const senderProfile = authManager.getUserProfile();
      const senderLanguage = senderProfile?.preferredLanguage || 'en';
      const senderName = senderProfile?.displayName || currentUser.email || 'User';
      
      // Create message data
      const messageData = {
        chatId: chatId,
        senderId: buyerId,
        receiverId: sellerId,
        senderName: senderName,
        message: message,
        originalLanguage: senderLanguage,
        attachments: attachments,
        read: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Add message to Firestore
      const messageRef = await this.db.collection('messages').add(messageData);
      
      // Create or update chat conversation
      const chatData = {
        participants: [buyerId, sellerId],
        lastMessage: message || this.ATTACHMENT_PLACEHOLDER,
        lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
        lastSenderId: buyerId,
        buyerId: buyerId,
        sellerId: sellerId
      };
      
      await this.db.collection('chats').doc(chatId).set(chatData, { merge: true });
      
      // Create notification for receiver
      await this.createChatNotification(sellerId, buyerId, message);
      
      console.log('Message sent successfully:', messageRef.id);
      return { success: true, messageId: messageRef.id };
      
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Upload chat file to Firebase Storage
  async uploadChatFile(chatId, file) {
    try {
      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        window.toast?.error(`File "${file.name}" exceeds 10MB limit`);
        throw new Error('File size exceeds 10MB limit');
      }
      
      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime',
        'application/pdf'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        window.toast?.error(`File type "${file.type}" not supported`);
        throw new Error('File type not supported');
      }
      
      const currentUser = authManager.getCurrentUser();
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const path = `chats/${chatId}/${fileName}`;
      
      console.log('Uploading file:', file.name, 'to path:', path);
      
      // Upload to Firebase Storage
      const storageRef = firebase.storage().ref(path);
      const uploadTask = await storageRef.put(file);
      const downloadURL = await uploadTask.ref.getDownloadURL();
      
      console.log('File uploaded successfully:', file.name, 'URL:', downloadURL);
      
      return {
        name: file.name,
        url: downloadURL,
        type: file.type,
        size: file.size,
        path: path
      };
      
    } catch (error) {
      console.error('Error uploading file:', file.name, error);
      throw error;
    }
  }

  // Subscribe to chat messages (real-time)
  async subscribeToChatMessages(sellerId, callback) {
    await this.init();
    
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      
      const currentUser = authManager.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const buyerId = currentUser.uid;
      const chatId = [buyerId, sellerId].sort().join('_');
      
      console.log('Subscribing to chat messages for chatId:', chatId);
      
      // Debounce timer for marking messages as read
      let markReadTimeout = null;
      
      // Subscribe to messages in this chat without orderBy to avoid index issues
      // We'll sort in memory instead
      const unsubscribe = this.db
        .collection('messages')
        .where('chatId', '==', chatId)
        .onSnapshot((snapshot) => {
          console.log('Messages snapshot received:', snapshot.docs.length, 'messages');
          
          // Sort messages by createdAt manually
          const messages = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .sort((a, b) => {
              const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
              const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
              return dateA - dateB;
            });
          
          console.log('Calling callback with sorted messages:', messages.length);
          callback(messages);
          
          // Debounce marking messages as read to avoid excessive writes
          if (markReadTimeout) {
            clearTimeout(markReadTimeout);
          }
          
          markReadTimeout = setTimeout(() => {
            // Mark unread messages as read (batched)
            const unreadMessages = snapshot.docs.filter(doc => {
              const msg = doc.data();
              return msg.receiverId === buyerId && !msg.read;
            });
            
            if (unreadMessages.length > 0) {
              const batch = this.db.batch();
              unreadMessages.forEach(doc => {
                batch.update(this.db.collection('messages').doc(doc.id), { read: true });
              });
              batch.commit().catch(err => console.error('Error marking messages as read:', err));
            }
          }, 1000); // Wait 1 second before marking as read
        }, (error) => {
          console.error('Error in message subscription:', error);
        });
      
      return unsubscribe;
      
    } catch (error) {
      console.error('Error subscribing to messages:', error);
      throw error;
    }
  }

  // Get all chats for a user
  async getUserChats() {
    await this.init();
    
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      
      const currentUser = authManager.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const userId = currentUser.uid;
      
      // Get all chats where user is a participant
      const snapshot = await this.db
        .collection('chats')
        .where('participants', 'array-contains', userId)
        .orderBy('lastMessageTime', 'desc')
        .get();
      
      // Get user details for each chat participant
      const chats = await Promise.all(snapshot.docs.map(async (doc) => {
        const chatData = doc.data();
        const otherUserId = chatData.participants.find(id => id !== userId);
        
        // Get other user's details
        let otherUser = { displayName: 'Unknown User', email: '', role: 'user' };
        try {
          const userDoc = await this.db.collection('users').doc(otherUserId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            const role = userData.role || 'user';
            const displayName = userData.displayName || userData.email || `${role.charAt(0).toUpperCase() + role.slice(1)}`;
            otherUser = {
              displayName: displayName,
              email: userData.email || '',
              role: role,
              company: userData.company || ''
            };
          }
        } catch (err) {
          console.error('Error fetching user details:', err);
        }
        
        // Create a more informative display name with role context
        let displayNameWithRole = otherUser.displayName;
        if (otherUser.company) {
          displayNameWithRole = `${otherUser.displayName} (${otherUser.company})`;
        }
        
        return {
          id: doc.id,
          ...chatData,
          otherUserId,
          otherUser,
          otherUserName: displayNameWithRole,
          otherUserRole: otherUser.role
        };
      }));
      
      return chats;
      
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw error;
    }
  }

  // Send a chat message from seller to buyer
  async sendSellerChatMessage({ buyerId, message, files = [] }) {
    await this.init();
    
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      
      const currentUser = authManager.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const sellerId = currentUser.uid;
      
      // Create chat conversation ID (consistent ordering: buyer_seller)
      const chatId = [buyerId, sellerId].sort().join('_');
      
      // Upload files if any (in parallel for better performance)
      const attachments = [];
      if (files.length > 0) {
        console.log(`[Seller] Uploading ${files.length} files...`);
        const uploadPromises = files.map(file => 
          this.uploadChatFile(chatId, file)
            .catch(error => {
              console.error('Error uploading file:', file.name, error);
              window.toast?.error(`Failed to upload: ${file.name}`);
              return null; // Return null for failed uploads
            })
        );
        const results = await Promise.all(uploadPromises);
        // Filter out failed uploads (null values)
        const successfulUploads = results.filter(att => att !== null);
        attachments.push(...successfulUploads);
        
        const failedCount = files.length - successfulUploads.length;
        if (failedCount > 0) {
          console.warn(`${failedCount} file(s) failed to upload`);
        }
        if (successfulUploads.length > 0) {
          console.log(`${successfulUploads.length} file(s) uploaded successfully`);
        }
      }
      
      // Get sender's preferred language from their profile
      const senderProfile = authManager.getUserProfile();
      const senderLanguage = senderProfile?.preferredLanguage || 'en';
      const senderName = senderProfile?.displayName || currentUser.email || 'User';
      
      // Create message data
      const messageData = {
        chatId: chatId,
        senderId: sellerId,
        receiverId: buyerId,
        senderName: senderName,
        message: message,
        originalLanguage: senderLanguage,
        attachments: attachments,
        read: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Add message to Firestore
      const messageRef = await this.db.collection('messages').add(messageData);
      
      // Create or update chat conversation
      const chatData = {
        participants: [buyerId, sellerId],
        lastMessage: message || this.ATTACHMENT_PLACEHOLDER,
        lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
        lastSenderId: sellerId,
        buyerId: buyerId,
        sellerId: sellerId
      };
      
      await this.db.collection('chats').doc(chatId).set(chatData, { merge: true });
      
      // Create notification for receiver (buyer)
      await this.createChatNotification(buyerId, sellerId, message);
      
      console.log('Message sent successfully:', messageRef.id);
      return { success: true, messageId: messageRef.id };
      
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Subscribe to chat messages for seller (real-time)
  async subscribeToSellerChatMessages(buyerId, callback) {
    await this.init();
    
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      
      const currentUser = authManager.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const sellerId = currentUser.uid;
      
      // Create chat conversation ID (consistent ordering: buyer_seller)
      const chatId = [buyerId, sellerId].sort().join('_');
      
      console.log('Subscribing to chat messages for chatId:', chatId);
      
      // Subscribe to messages in this chat without orderBy to avoid index issues
      // We'll sort in memory instead
      const unsubscribe = this.db
        .collection('messages')
        .where('chatId', '==', chatId)
        .onSnapshot(
          (snapshot) => {
            // Sort messages by createdAt in memory
            const messages = snapshot.docs
              .map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  ...data,
                  // Handle serverTimestamp that might not be set yet
                  createdAt: data.createdAt || new Date()
                };
              })
              .sort((a, b) => {
                const timeA = a.createdAt?.toDate?.() || a.createdAt;
                const timeB = b.createdAt?.toDate?.() || b.createdAt;
                return timeA - timeB;
              });
            
            callback(messages);
          },
          (error) => {
            console.error('Error subscribing to messages:', error);
            callback([]);
          }
        );
      
      return unsubscribe;
      
    } catch (error) {
      console.error('Error setting up message subscription:', error);
      throw error;
    }
  }

  // Create chat notification
  async createChatNotification(receiverId, senderId, message) {
    try {
      if (!this.db) return;
      
      // Get sender info
      const senderDoc = await this.db.collection('users').doc(senderId).get();
      const senderName = senderDoc.exists ? 
        (senderDoc.data().displayName || senderDoc.data().email || 'Someone') : 
        'Someone';
      
      // Create notification
      await this.db.collection('notifications').add({
        userId: receiverId,
        type: 'chat',
        title: 'New Message',
        message: `${senderName}: ${message || this.ATTACHMENT_PLACEHOLDER}`,
        senderId: senderId,
        senderName: senderName,
        read: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error creating notification:', error);
      // Don't throw - notification failure shouldn't block message sending
    }
  }

  // Get user notifications
  async getNotifications(userId) {
    await this.init();
    
    try {
      if (!this.db || !userId) {
        return [];
      }
      
      const snapshot = await this.db
        .collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    await this.init();
    
    try {
      if (!this.db || !notificationId) return;
      
      await this.db.collection('notifications').doc(notificationId).update({
        read: true
      });
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // ==================== Invoice Methods ====================

  // Generate unique invoice number using Firestore transaction
  async generateInvoiceNumber() {
    await this.init();
    
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      
      // Use a counter document to ensure atomic increment
      const counterRef = this.db.collection('_counters').doc('invoices');
      
      // Run a transaction to safely increment the counter
      const invoiceNumber = await this.db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        
        let nextNumber = 1;
        const currentYear = new Date().getFullYear();
        
        if (counterDoc.exists) {
          const data = counterDoc.data();
          // Check if we need to reset the counter for a new year
          if (data.year === currentYear) {
            nextNumber = (data.lastNumber || 0) + 1;
          } else {
            // New year, reset counter to 1
            nextNumber = 1;
          }
        }
        
        // Update the counter
        transaction.set(counterRef, {
          lastNumber: nextNumber,
          year: currentYear,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Generate invoice number
        return `INV-${currentYear}-${String(nextNumber).padStart(5, '0')}`;
      });
      
      return invoiceNumber;
      
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to timestamp-based number if transaction fails
      return `INV-${Date.now()}`;
    }
  }

  // Create invoice from order
  async createInvoice(orderId) {
    await this.init();
    
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      
      // Get order data
      const orderDoc = await this.db.collection('orders').doc(orderId).get();
      if (!orderDoc.exists) {
        throw new Error('Order not found');
      }
      
      const order = orderDoc.data();
      
      // Get seller info
      const sellerDoc = await this.db.collection('users').doc(order.sellerId).get();
      const sellerData = sellerDoc.exists ? sellerDoc.data() : {};
      
      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();
      
      // Calculate due date (30 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      
      // Create invoice data
      const invoiceData = {
        invoiceNumber: invoiceNumber,
        orderId: orderId,
        
        // Buyer information
        buyerId: order.buyerId,
        buyerName: order.buyerName || 'N/A',
        buyerEmail: order.buyerEmail || 'N/A',
        buyerCompany: order.buyerCompany || 'N/A',
        buyerAddress: order.buyerAddress || {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: ''
        },
        
        // Seller information
        sellerId: order.sellerId,
        sellerName: sellerData.displayName || 'N/A',
        sellerEmail: sellerData.email || 'N/A',
        sellerCompany: sellerData.company || 'N/A',
        sellerAddress: sellerData.address || {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: ''
        },
        
        // Items
        items: order.items || [],
        
        // Amounts
        subtotal: order.subtotal || 0,
        tax: order.tax || 0,
        taxRate: order.taxRate || 10,
        total: order.total || 0,
        depositPaid: order.depositAmount || 0,
        remainingBalance: order.remainingBalance || 0,
        
        // Payment info
        paymentMethod: order.paymentMethod || 'N/A',
        paymentTerms: `${order.depositPercentage || 30}% deposit, ${100 - (order.depositPercentage || 30)}% on delivery`,
        
        // Dates
        dueDate: firebase.firestore.Timestamp.fromDate(dueDate),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        
        // Status
        status: 'issued', // issued, paid, overdue, cancelled
        
        // Notes
        notes: 'Thank you for your business!'
      };
      
      // Create invoice
      const invoiceRef = await this.db.collection('invoices').add(invoiceData);
      
      console.log('Invoice created successfully:', invoiceRef.id, invoiceNumber);
      
      return {
        success: true,
        invoiceId: invoiceRef.id,
        invoiceNumber: invoiceNumber
      };
      
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  // Get invoices for user
  async getInvoices(filters = {}) {
    await this.init();
    
    try {
      if (!this.db) {
        return [];
      }
      
      let query = this.db.collection('invoices');
      
      // Apply filters
      if (filters.buyerId) {
        query = query.where('buyerId', '==', filters.buyerId);
      }
      
      if (filters.sellerId) {
        query = query.where('sellerId', '==', filters.sellerId);
      }
      
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }
      
      // Try to order by creation date descending
      try {
        const orderedQuery = query.orderBy('createdAt', 'desc');
        const snapshot = await orderedQuery.get();
        
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (indexError) {
        // If index error, try without orderBy
        console.warn('Firestore index not available for invoices, fetching without ordering:', indexError);
        const snapshot = await query.get();
        
        // Sort in memory
        const invoices = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort by createdAt
        invoices.sort((a, b) => {
          const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
          const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
          return dateB - dateA;
        });
        
        return invoices;
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  // Get single invoice
  async getInvoice(invoiceId) {
    await this.init();
    
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      
      const doc = await this.db.collection('invoices').doc(invoiceId).get();
      
      if (!doc.exists) {
        throw new Error('Invoice not found');
      }
      
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  }

  // Update invoice status
  async updateInvoiceStatus(invoiceId, status) {
    await this.init();
    
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      
      const updateData = {
        status: status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // If marking as paid, set paidAt timestamp
      if (status === 'paid') {
        updateData.paidAt = firebase.firestore.FieldValue.serverTimestamp();
      }
      
      await this.db.collection('invoices').doc(invoiceId).update(updateData);
      
      console.log('Invoice status updated:', invoiceId, status);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }
  }
}

export default new DataService();
