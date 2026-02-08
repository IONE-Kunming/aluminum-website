import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import cartManager from '../js/cart.js';
import dataService from '../js/dataService.js';
import { escapeHtml } from '../js/utils.js';

export async function renderCart() {
  const cartItems = cartManager.getCart();
  const cartTotal = cartManager.getCartTotal();
  
  // Validate product availability
  let productValidation = {};
  let hasUnavailableItems = false;
  let validationFailed = false;
  
  if (cartItems.length > 0) {
    const productIds = cartItems.map(item => item.id.toString());
    productValidation = await dataService.validateProducts(productIds);
    
    // Check if validation actually ran (returns empty object on error)
    if (Object.keys(productValidation).length === 0 && productIds.length > 0) {
      validationFailed = true;
      console.warn('Product validation failed - unable to verify product availability');
    } else {
      hasUnavailableItems = Object.values(productValidation).some(isValid => !isValid);
    }
  }
  
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
        ${validationFailed ? `
          <div class="alert alert-warning">
            <i data-lucide="alert-triangle"></i>
            <div>
              <strong>Unable to verify product availability</strong>
              <p>There was an error checking if products are still available. Please proceed with caution.</p>
            </div>
          </div>
        ` : ''}
        
        ${hasUnavailableItems ? `
          <div class="alert alert-warning">
            <i data-lucide="alert-triangle"></i>
            <div>
              <strong>Some items are no longer available</strong>
              <p>Products marked as "Out of Stock" have been removed by the seller. Please remove them from your cart to proceed.</p>
            </div>
          </div>
        ` : ''}
        
        <div class="cart-items">
          ${cartItems.map(item => {
            const isAvailable = productValidation[item.id] !== false;
            return `
            <div class="cart-item card ${!isAvailable ? 'cart-item-unavailable' : ''}" data-item-id="${item.id}">
              ${!isAvailable ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
              ${item.imageUrl ? `
                <img src="${item.imageUrl}" alt="${escapeHtml(item.modelNumber || item.name)}" 
                     class="cart-item-image"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div class="cart-item-placeholder" style="display: none;">
                  <i data-lucide="package" style="width: 48px; height: 48px; color: white; opacity: 0.8;"></i>
                </div>
              ` : `
                <div class="cart-item-placeholder">
                  <i data-lucide="package" style="width: 48px; height: 48px; color: white; opacity: 0.8;"></i>
                </div>
              `}
              <div class="cart-item-info">
                <h3>${escapeHtml(item.modelNumber || item.name)}</h3>
                <p class="cart-item-seller">${escapeHtml(item.seller)}</p>
                <p class="cart-item-description">${escapeHtml(item.description || '')}</p>
                ${!isAvailable ? '<p class="text-danger"><strong>This product is no longer available</strong></p>' : ''}
              </div>
              <div class="cart-item-details">
                <div class="cart-item-price">
                  <span class="label">Price:</span>
                  <span class="value">$${item.price}/${escapeHtml(item.unit)}</span>
                </div>
                <div class="cart-item-quantity">
                  <label>Quantity:</label>
                  <div class="quantity-controls">
                    <button class="quantity-btn" data-action="decrease" data-item-id="${item.id}" ${!isAvailable ? 'disabled' : ''}>
                      <i data-lucide="minus"></i>
                    </button>
                    <input 
                      type="number" 
                      value="${item.quantity}" 
                      min="${item.minOrder}"
                      step="${item.minOrder}"
                      class="quantity-input"
                      data-item-id="${item.id}"
                      ${!isAvailable ? 'disabled' : ''}
                    />
                    <button class="quantity-btn" data-action="increase" data-item-id="${item.id}" ${!isAvailable ? 'disabled' : ''}>
                      <i data-lucide="plus"></i>
                    </button>
                  </div>
                </div>
                <div class="cart-item-subtotal">
                  <span class="label">Subtotal:</span>
                  <span class="value ${!isAvailable ? 'text-muted' : ''}">$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
              <button class="cart-item-remove" data-item-id="${item.id}">
                <i data-lucide="trash-2"></i>
                Remove
              </button>
            </div>
          `;
          }).join('')}
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
          <button class="btn btn-primary" id="checkout-btn" ${hasUnavailableItems ? 'disabled' : ''}>
            Proceed to Checkout
          </button>
          ${hasUnavailableItems ? '<p class="text-danger" style="margin-top: 0.5rem; font-size: 0.875rem;">Remove unavailable items to proceed</p>' : ''}
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
    btn.addEventListener('click', async () => {
      const itemId = parseInt(btn.getAttribute('data-item-id'));
      await cartManager.removeFromCart(itemId);
      window.toast.success('Item removed from cart');
      await renderCart(); // Re-render
    });
  });

  // Quantity controls
  document.querySelectorAll('.quantity-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const action = btn.getAttribute('data-action');
      const itemId = parseInt(btn.getAttribute('data-item-id'));
      const cartItems = cartManager.getCart();
      const item = cartItems.find(i => i.id === itemId);
      
      if (item) {
        const step = item.minOrder || 1;
        if (action === 'increase') {
          await cartManager.updateQuantity(itemId, item.quantity + step);
          await renderCart(); // Re-render
        } else if (action === 'decrease') {
          const newQty = item.quantity - step;
          if (newQty >= step) {
            await cartManager.updateQuantity(itemId, newQty);
            await renderCart(); // Re-render
          } else {
            window.toast.warning(`Minimum order quantity is ${step}`);
          }
        }
      }
    });
  });

  // Quantity input changes
  document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('change', async (e) => {
      const itemId = parseInt(input.getAttribute('data-item-id'));
      const newQty = parseInt(input.value);
      const cartItems = cartManager.getCart();
      const item = cartItems.find(i => i.id === itemId);
      
      if (item) {
        const minQty = item.minOrder || 1;
        if (newQty >= minQty && !isNaN(newQty)) {
          await cartManager.updateQuantity(itemId, newQty);
          await renderCart(); // Re-render
        } else {
          window.toast.warning(`Minimum order quantity is ${minQty}`);
          input.value = item.quantity; // Reset to current value
        }
      }
    });
    
    // Also handle input event for real-time updates
    input.addEventListener('input', async (e) => {
      const itemId = parseInt(input.getAttribute('data-item-id'));
      const newQty = parseInt(input.value);
      
      if (!isNaN(newQty) && newQty > 0) {
        const cartItems = cartManager.getCart();
        const item = cartItems.find(i => i.id === itemId);
        
        if (item) {
          const minQty = item.minOrder || 1;
          if (newQty >= minQty) {
            // Update quantity without re-rendering to avoid losing focus
            await cartManager.updateQuantity(itemId, newQty);
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
