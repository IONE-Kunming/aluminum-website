import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import cartManager from '../js/cart.js';
import dataService from '../js/dataService.js';
import { escapeHtml } from '../js/utils.js';
import languageManager from '../js/language.js';

export async function renderCart() {
  const t = languageManager.t.bind(languageManager);
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
        <h1>${t('cart.title')}</h1>
        <p>${t('cart.subtitle')}</p>
      </div>

      ${cartItems.length === 0 ? `
        <div class="cart-empty">
          <i data-lucide="shopping-cart" style="width: 64px; height: 64px; opacity: 0.3;"></i>
          <h2>${t('cart.emptyCart')}</h2>
          <p>${t('cart.reviewItems')}</p>
          <button class="btn btn-primary" data-nav="/buyer/catalog">
            ${t('cart.browseCatalog')}
          </button>
        </div>
      ` : `
        ${validationFailed ? `
          <div class="alert alert-warning">
            <i data-lucide="alert-triangle"></i>
            <div>
              <strong>${t('cart.unableToVerify')}</strong>
              <p>${t('cart.proceedWithCaution')}</p>
            </div>
          </div>
        ` : ''}
        
        ${hasUnavailableItems ? `
          <div class="alert alert-warning">
            <i data-lucide="alert-triangle"></i>
            <div>
              <strong>${t('cart.someItemsUnavailable')}</strong>
              <p>${t('cart.unavailableMessage')}</p>
            </div>
          </div>
        ` : ''}
        
        <div class="cart-items">
          ${cartItems.map(item => {
            const isAvailable = productValidation[item.id] !== false;
            return `
            <div class="cart-item card ${!isAvailable ? 'cart-item-unavailable' : ''}" data-item-id="${item.id}">
              ${!isAvailable ? `<div class="out-of-stock-badge">${t('cart.outOfStock')}</div>` : ''}
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
                ${!isAvailable ? `<p class="text-danger"><strong>${t('cart.productNoLongerAvailable')}</strong></p>` : ''}
              </div>
              <div class="cart-item-details">
                <div class="cart-item-price">
                  <span class="label">${t('cart.price')}:</span>
                  <span class="value">$${item.price}/${escapeHtml(item.unit)}</span>
                </div>
                <div class="cart-item-quantity">
                  <label>${t('cart.quantity')}:</label>
                  <div class="quantity-controls">
                    <button type="button" class="quantity-btn" data-action="decrease" data-item-id="${item.id}" ${!isAvailable ? 'disabled' : ''}>
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
                    <button type="button" class="quantity-btn" data-action="increase" data-item-id="${item.id}" ${!isAvailable ? 'disabled' : ''}>
                      <i data-lucide="plus"></i>
                    </button>
                  </div>
                </div>
                <div class="cart-item-subtotal">
                  <span class="label">${t('cart.subtotal')}:</span>
                  <span class="value ${!isAvailable ? 'text-muted' : ''}">$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
              <button class="cart-item-remove" data-item-id="${item.id}">
                <i data-lucide="trash-2"></i>
                ${t('cart.remove')}
              </button>
            </div>
          `;
          }).join('')}
        </div>

        <div class="cart-summary card">
          <h2>${t('cart.orderSummary')}</h2>
          <div class="summary-row">
            <span>${t('cart.subtotal')}:</span>
            <span>$${cartTotal.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>${t('cart.tax')}:</span>
            <span>$${(cartTotal * 0.1).toFixed(2)}</span>
          </div>
          <div class="summary-row summary-total">
            <span>${t('cart.total')}:</span>
            <span>$${(cartTotal * 1.1).toFixed(2)}</span>
          </div>
          <button class="btn btn-primary" id="checkout-btn" ${hasUnavailableItems ? 'disabled' : ''}>
            ${t('cart.proceedToCheckout')}
          </button>
          ${hasUnavailableItems ? `<p class="text-danger" style="margin-top: 0.5rem; font-size: 0.875rem;">${t('cart.removeUnavailableItems')}</p>` : ''}
        </div>
      `}
    </div>
  `;

  renderPageWithLayout(content, 'buyer');

  // Helper function to calculate item subtotal
  function calculateItemSubtotal(item) {
    return (item.price * item.quantity).toFixed(2);
  }

  // Helper function to get minimum quantity for an item
  function getMinQuantity(item) {
    return item.minOrder || 1;
  }

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
      
      // Show immediate feedback with toast
      window.toast.success(t('cart.itemRemoved'));
      
      // Then remove and re-render
      await cartManager.removeFromCart(itemId);
      await renderCart();
    });
  });

  // Quantity controls
  document.querySelectorAll('.quantity-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const action = btn.getAttribute('data-action');
      const itemId = parseInt(btn.getAttribute('data-item-id'));
      let cartItems = cartManager.getCart();
      let item = cartItems.find(i => i.id === itemId);
      
      if (item) {
        const step = getMinQuantity(item);
        let newQuantity;
        
        if (action === 'increase') {
          newQuantity = item.quantity + step;
          await cartManager.updateQuantity(itemId, newQuantity);
          
          // Get updated cart and item after quantity change
          cartItems = cartManager.getCart();
          item = cartItems.find(i => i.id === itemId);
          
          // Update UI without full re-render
          const cartItemEl = btn.closest('.cart-item');
          const quantityInput = cartItemEl.querySelector('.quantity-input');
          const subtotalEl = cartItemEl.querySelector('.cart-item-subtotal .value');
          
          if (quantityInput) quantityInput.value = newQuantity;
          if (subtotalEl && item) subtotalEl.textContent = `$${calculateItemSubtotal(item)}`;
          
          updateCartSummary();
        } else if (action === 'decrease') {
          newQuantity = item.quantity - step;
          if (newQuantity >= step) {
            await cartManager.updateQuantity(itemId, newQuantity);
            
            // Get updated cart and item after quantity change
            cartItems = cartManager.getCart();
            item = cartItems.find(i => i.id === itemId);
            
            // Update UI without full re-render
            const cartItemEl = btn.closest('.cart-item');
            const quantityInput = cartItemEl.querySelector('.quantity-input');
            const subtotalEl = cartItemEl.querySelector('.cart-item-subtotal .value');
            
            if (quantityInput) quantityInput.value = newQuantity;
            if (subtotalEl && item) subtotalEl.textContent = `$${calculateItemSubtotal(item)}`;
            
            updateCartSummary();
          } else {
            window.toast.warning(`${t('cart.minOrderQuantity')} ${step}`);
          }
        }
      }
    });
  });

  // Quantity input changes
  document.querySelectorAll('.quantity-input').forEach(input => {
    // Handle Enter key press
    input.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const itemId = parseInt(input.getAttribute('data-item-id'));
        const newQuantity = parseInt(input.value);
        let cartItems = cartManager.getCart();
        let item = cartItems.find(i => i.id === itemId);
        
        if (item) {
          const minQty = getMinQuantity(item);
          if (newQuantity >= minQty && !isNaN(newQuantity)) {
            await cartManager.updateQuantity(itemId, newQuantity);
            
            // Get updated cart after quantity change
            cartItems = cartManager.getCart();
            item = cartItems.find(i => i.id === itemId);
            
            // Update the subtotal for this item
            const subtotalEl = input.closest('.cart-item').querySelector('.cart-item-subtotal .value');
            if (subtotalEl && item) {
              subtotalEl.textContent = `$${calculateItemSubtotal(item)}`;
            }
            // Update the cart summary
            updateCartSummary();
            window.toast.success(t('cart.quantityUpdated'));
          } else {
            window.toast.warning(`${t('cart.minOrderQuantity')} ${minQty}`);
            input.value = item.quantity; // Reset to current value
          }
        }
      }
    });
    
    input.addEventListener('change', async (e) => {
      const itemId = parseInt(input.getAttribute('data-item-id'));
      const newQuantity = parseInt(input.value);
      let cartItems = cartManager.getCart();
      let item = cartItems.find(i => i.id === itemId);
      
      if (item) {
        const minQty = getMinQuantity(item);
        if (newQuantity >= minQty && !isNaN(newQuantity)) {
          await cartManager.updateQuantity(itemId, newQuantity);
          
          // Get updated cart after quantity change
          cartItems = cartManager.getCart();
          item = cartItems.find(i => i.id === itemId);
          
          // Update the subtotal for this item
          const subtotalEl = input.closest('.cart-item').querySelector('.cart-item-subtotal .value');
          if (subtotalEl && item) {
            subtotalEl.textContent = `$${calculateItemSubtotal(item)}`;
          }
          // Update the cart summary
          updateCartSummary();
        } else {
          window.toast.warning(`${t('cart.minOrderQuantity')} ${minQty}`);
          input.value = item.quantity; // Reset to current value
        }
      }
    });
    
    // Also handle input event for real-time updates
    input.addEventListener('input', async (e) => {
      const itemId = parseInt(input.getAttribute('data-item-id'));
      const newQty = parseInt(input.value);
      
      if (!isNaN(newQty) && newQty > 0) {
        let cartItems = cartManager.getCart();
        let item = cartItems.find(i => i.id === itemId);
        
        if (item) {
          const minQty = item.minOrder || 1;
          if (newQty >= minQty) {
            // Update quantity without re-rendering to avoid losing focus
            await cartManager.updateQuantity(itemId, newQty);
            // Get the updated cart after quantity change
            cartItems = cartManager.getCart();
            item = cartItems.find(i => i.id === itemId);
            if (item) {
              // Just update the subtotal for this item
              const subtotalEl = input.closest('.cart-item').querySelector('.cart-item-subtotal .value');
              if (subtotalEl) {
                subtotalEl.textContent = `$${calculateItemSubtotal(item)}`;
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
