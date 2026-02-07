import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import cartManager from '../js/cart.js';
import { escapeHtml } from '../js/utils.js';

export function renderCart() {
  const cartItems = cartManager.getCart();
  const cartTotal = cartManager.getCartTotal();
  
  const content = `
    <div class="cart-page">
      <div class="page-header">
        <h1>Shopping Cart</h1>
        <p>Review your items before checkout</p>
      </div>

      ${cartItems.length === 0 ? `
        <div class="cart-empty">
          <i data-lucide="shopping-cart" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>Your cart is empty</h2>
          <p>Browse our catalog to add products to your cart</p>
          <button class="btn btn-primary" data-nav="/buyer/catalog">
            Browse Catalog
          </button>
        </div>
      ` : `
        <div class="cart-items">
          ${cartItems.map(item => `
            <div class="cart-item card" data-item-id="${item.id}">
              <div class="cart-item-info">
                <h3>${escapeHtml(item.name)}</h3>
                <p class="cart-item-seller">${escapeHtml(item.seller)}</p>
                <p class="cart-item-description">${escapeHtml(item.description)}</p>
              </div>
              <div class="cart-item-details">
                <div class="cart-item-price">
                  <span class="label">Price:</span>
                  <span class="value">$${item.price}/${escapeHtml(item.unit)}</span>
                </div>
                <div class="cart-item-quantity">
                  <label>Quantity:</label>
                  <div class="quantity-controls">
                    <button class="quantity-btn" data-action="decrease" data-item-id="${item.id}">
                      <i data-lucide="minus"></i>
                    </button>
                    <input 
                      type="number" 
                      value="${item.quantity}" 
                      min="${item.minOrder}"
                      step="${item.minOrder}"
                      class="quantity-input"
                      data-item-id="${item.id}"
                    />
                    <button class="quantity-btn" data-action="increase" data-item-id="${item.id}">
                      <i data-lucide="plus"></i>
                    </button>
                  </div>
                </div>
                <div class="cart-item-subtotal">
                  <span class="label">Subtotal:</span>
                  <span class="value">$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
              <button class="cart-item-remove" data-item-id="${item.id}">
                <i data-lucide="trash-2"></i>
                Remove
              </button>
            </div>
          `).join('')}
        </div>

        <div class="cart-summary card">
          <h2>Order Summary</h2>
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>$${cartTotal.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>Tax (estimated):</span>
            <span>$${(cartTotal * 0.1).toFixed(2)}</span>
          </div>
          <div class="summary-row summary-total">
            <span>Total:</span>
            <span>$${(cartTotal * 1.1).toFixed(2)}</span>
          </div>
          <button class="btn btn-primary" id="checkout-btn">
            Proceed to Checkout
          </button>
        </div>
      `}
    </div>
  `;

  renderPageWithLayout(content, 'buyer');

  // Helper function to update cart summary without full re-render
  function updateCartSummary() {
    const total = cartManager.getCartTotal();
    const subtotalEl = document.querySelector('.cart-summary .summary-row:nth-child(2) span:last-child');
    const taxEl = document.querySelector('.cart-summary .summary-row:nth-child(3) span:last-child');
    const totalEl = document.querySelector('.cart-summary .summary-total span:last-child');
    
    if (subtotalEl) subtotalEl.textContent = `$${total.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `$${(total * 0.1).toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${(total * 1.1).toFixed(2)}`;
  }

  // Navigation buttons
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      router.navigate(btn.getAttribute('data-nav'));
    });
  });

  // Remove item buttons
  document.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = parseInt(btn.getAttribute('data-item-id'));
      cartManager.removeFromCart(itemId);
      window.toast.success('Item removed from cart');
      renderCart(); // Re-render
    });
  });

  // Quantity controls
  document.querySelectorAll('.quantity-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const action = btn.getAttribute('data-action');
      const itemId = parseInt(btn.getAttribute('data-item-id'));
      const cartItems = cartManager.getCart();
      const item = cartItems.find(i => i.id === itemId);
      
      if (item) {
        const step = item.minOrder || 1;
        if (action === 'increase') {
          cartManager.updateQuantity(itemId, item.quantity + step);
          renderCart(); // Re-render
        } else if (action === 'decrease') {
          const newQty = item.quantity - step;
          if (newQty >= step) {
            cartManager.updateQuantity(itemId, newQty);
            renderCart(); // Re-render
          } else {
            window.toast.warning(`Minimum order quantity is ${step}`);
          }
        }
      }
    });
  });

  // Quantity input changes
  document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const itemId = parseInt(input.getAttribute('data-item-id'));
      const newQty = parseInt(input.value);
      const cartItems = cartManager.getCart();
      const item = cartItems.find(i => i.id === itemId);
      
      if (item) {
        const minQty = item.minOrder || 1;
        if (newQty >= minQty && !isNaN(newQty)) {
          cartManager.updateQuantity(itemId, newQty);
          renderCart(); // Re-render
        } else {
          window.toast.warning(`Minimum order quantity is ${minQty}`);
          input.value = item.quantity; // Reset to current value
        }
      }
    });
    
    // Also handle input event for real-time updates
    input.addEventListener('input', (e) => {
      const itemId = parseInt(input.getAttribute('data-item-id'));
      const newQty = parseInt(input.value);
      
      if (!isNaN(newQty) && newQty > 0) {
        const cartItems = cartManager.getCart();
        const item = cartItems.find(i => i.id === itemId);
        
        if (item) {
          const minQty = item.minOrder || 1;
          if (newQty >= minQty) {
            // Update quantity without re-rendering to avoid losing focus
            cartManager.updateQuantity(itemId, newQty);
            // Get the updated item after quantity change
            const updatedCartItems = cartManager.getCart();
            const updatedItem = updatedCartItems.find(i => i.id === itemId);
            if (updatedItem) {
              // Just update the subtotal for this item
              const subtotalEl = input.closest('.cart-item').querySelector('.cart-item-subtotal .value');
              if (subtotalEl) {
                subtotalEl.textContent = `$${(updatedItem.price * updatedItem.quantity).toFixed(2)}`;
              }
              // Update the cart summary
              updateCartSummary();
            }
          }
        }
      }
    });
  });

  // Checkout button
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      router.navigate('/buyer/checkout');
    });
  }

  if (window.lucide) window.lucide.createIcons();
}
