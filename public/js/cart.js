// Cart State Manager
class CartManager {
  constructor() {
    this.storageKey = 'aluminum-cart';
    this.currentUserId = null;
    this.db = null;
    this.cartCache = [];
    this.initialized = false;
  }

  // Initialize cart manager with user context
  async init(userId) {
    this.currentUserId = userId;
    
    // Wait for Firebase to be available
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      this.db = firebase.firestore();
      this.initialized = true;
      
      // Load cart from Firestore for this user
      await this.loadCartFromFirestore();
    } else {
      // Fallback to localStorage with user-specific key
      this.initialized = false;
      this.cartCache = this.getCartFromLocalStorage();
    }
    
    this.notifyListeners();
  }

  // Get user-specific storage key
  getUserStorageKey() {
    return this.currentUserId 
      ? `${this.storageKey}-${this.currentUserId}`
      : this.storageKey;
  }

  // Load cart from Firestore
  async loadCartFromFirestore() {
    if (!this.db || !this.currentUserId) {
      return;
    }
    
    try {
      const cartDoc = await this.db.collection('carts').doc(this.currentUserId).get();
      
      if (cartDoc.exists) {
        const data = cartDoc.data();
        this.cartCache = data.items || [];
      } else {
        this.cartCache = [];
      }
    } catch (error) {
      console.error('Error loading cart from Firestore:', error);
      // Fallback to localStorage
      this.cartCache = this.getCartFromLocalStorage();
    }
  }

  // Save cart to Firestore
  async saveCartToFirestore(cart) {
    if (!this.db || !this.currentUserId) {
      return;
    }
    
    try {
      await this.db.collection('carts').doc(this.currentUserId).set({
        items: cart,
        updatedAt: new Date().toISOString()
      });
      
      // Also save to localStorage as backup
      this.saveCartToLocalStorage(cart);
    } catch (error) {
      console.warn('Error saving cart to Firestore, using localStorage:', error);
      // Always save to localStorage as fallback
      this.saveCartToLocalStorage(cart);
    }
  }

  // Get cart from localStorage
  getCartFromLocalStorage() {
    try {
      const cartData = localStorage.getItem(this.getUserStorageKey());
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error('Error reading cart from localStorage:', error);
      return [];
    }
  }

  // Save cart to localStorage
  saveCartToLocalStorage(cart) {
    try {
      localStorage.setItem(this.getUserStorageKey(), JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }

  getCart() {
    return this.cartCache;
  }

  async addToCart(product, quantity = 1) {
    const cart = this.getCart();
    
    // Use cartItemId if available, otherwise fall back to product id
    const itemId = product.cartItemId || product.id;
    
    // Check if this exact item (including dimensions) already exists in cart
    const existingItem = cart.find(item => {
      const existingItemId = item.cartItemId || item.id;
      return existingItemId === itemId;
    });
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        ...product,
        quantity: quantity,
        addedAt: new Date().toISOString()
      });
    }
    
    await this.saveCart(cart);
    this.notifyListeners();
    return true;
  }

  async removeFromCart(itemId) {
    try {
      let cart = this.getCart();
      cart = cart.filter(item => {
        const currentItemId = item.cartItemId || item.id;
        return currentItemId !== itemId;
      });
      await this.saveCart(cart);
      this.notifyListeners();
    } catch (error) {
      console.error('Error removing item from cart:', error);
      // Try to at least update the cache
      this.cartCache = this.cartCache.filter(item => {
        const currentItemId = item.cartItemId || item.id;
        return currentItemId !== itemId;
      });
      this.saveCartToLocalStorage(this.cartCache);
      this.notifyListeners();
      throw error; // Re-throw so UI can handle it
    }
  }

  async updateQuantity(itemId, quantity) {
    const cart = this.getCart();
    const item = cart.find(item => {
      const currentItemId = item.cartItemId || item.id;
      return currentItemId === itemId;
    });
    
    if (item) {
      if (quantity <= 0) {
        await this.removeFromCart(itemId);
      } else {
        item.quantity = quantity;
        await this.saveCart(cart);
        this.notifyListeners();
      }
    }
  }

  async clearCart() {
    // Clear from Firestore first
    if (this.db && this.currentUserId) {
      try {
        await this.db.collection('carts').doc(this.currentUserId).delete();
      } catch (error) {
        console.error('Error clearing cart from Firestore:', error);
        // Continue to clear local cache even if Firestore fails
      }
    }
    
    // Clear from localStorage
    localStorage.removeItem(this.getUserStorageKey());
    
    // Clear cache last (after both operations attempted)
    this.cartCache = [];
    this.notifyListeners();
  }

  getCartCount() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
  }

  getCartTotal() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  async saveCart(cart) {
    this.cartCache = cart;
    
    // Save to Firestore if available
    if (this.initialized && this.db) {
      await this.saveCartToFirestore(cart);
    } else {
      // Fallback to localStorage
      this.saveCartToLocalStorage(cart);
    }
  }

  // Switch user context (called on login/logout)
  async switchUser(userId) {
    // Capture guest cart BEFORE changing user context
    const guestStorageKey = this.storageKey; // The original guest key
    const guestCart = this.currentUserId === null 
      ? this.getCartFromLocalStorage() 
      : [];
    
    await this.init(userId);
    
    // Merge guest cart with user cart if guest had items
    if (guestCart.length > 0) {
      const currentCart = this.getCart();
      const mergedCart = [...currentCart];
      
      // Merge guest cart items
      guestCart.forEach(guestItem => {
        const existingIndex = mergedCart.findIndex(item => item.id === guestItem.id);
        if (existingIndex >= 0) {
          // Update quantity if item already exists
          mergedCart[existingIndex].quantity += guestItem.quantity;
        } else {
          // Add new item
          mergedCart.push(guestItem);
        }
      });
      
      // Save merged cart
      await this.saveCart(mergedCart);
      
      // Clear guest cart from localStorage using the original guest key
      localStorage.removeItem(guestStorageKey);
    }
  }

  // Clear user context (called on logout)
  async logout() {
    this.currentUserId = null;
    this.cartCache = [];
    this.notifyListeners();
  }

  // Listener management for reactive updates
  listeners = [];

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  // Alias for compatibility with different calling patterns
  subscribe(callback) {
    this.addListener(callback);
    // Return unsubscribe function
    return () => this.removeListener(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.getCart()));
  }
}

export default new CartManager();
