// Cart State Manager
class CartManager {
  constructor() {
    this.storageKey = 'aluminum-cart';
    this.init();
  }

  init() {
    // Listen for storage changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey) {
        this.notifyListeners();
      }
    });
  }

  getCart() {
    try {
      const cartData = localStorage.getItem(this.storageKey);
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error('Error reading cart:', error);
      return [];
    }
  }

  addToCart(product, quantity = 1) {
    const cart = this.getCart();
    
    // Check if product already exists in cart
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        ...product,
        quantity: quantity,
        addedAt: new Date().toISOString()
      });
    }
    
    this.saveCart(cart);
    this.notifyListeners();
    return true;
  }

  removeFromCart(productId) {
    let cart = this.getCart();
    cart = cart.filter(item => item.id !== productId);
    this.saveCart(cart);
    this.notifyListeners();
  }

  updateQuantity(productId, quantity) {
    const cart = this.getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        this.saveCart(cart);
        this.notifyListeners();
      }
    }
  }

  clearCart() {
    localStorage.removeItem(this.storageKey);
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

  saveCart(cart) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }

  // Listener management for reactive updates
  listeners = [];

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.getCart()));
  }
}

export default new CartManager();
