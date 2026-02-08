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
        
        <div class="cart-items" id="cart-items-container">
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
            <span id="cart-subtotal">$${cartTotal.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>${t('cart.tax')}:</span>
            <span id="cart-tax">$${(cartTotal * 0.1).toFixed(2)}</span>
          </div>
          <div class="summary-row summary-total">
            <span>${t('cart.total')}:</span>
            <span id="cart-total">$${(cartTotal * 1.1).toFixed(2)}</span>
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

  // Event Delegation - أفضل ممارسة
  document.addEventListener('click', handleCartClick);
  document.addEventListener('change', handleQuantityChange);
  document.addEventListener('keypress', handleQuantityKeypress);
  document.addEventListener('input', handleQuantityInput);

  // Navigation buttons
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      router.navigate(btn.getAttribute('data-nav'));
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

  // Cleanup function
  return () => {
    document.removeEventListener('click', handleCartClick);
    document.removeEventListener('change', handleQuantityChange);
    document.removeEventListener('keypress', handleQuantityKeypress);
    document.removeEventListener('input', handleQuantityInput);
  };
}

// Event Handlers باستخدام Event Delegation
async function handleCartClick(e) {
  const target = e.target;
  
  // Handle remove button
  if (target.closest('.cart-item-remove')) {
    const removeBtn = target.closest('.cart-item-remove');
    const itemId = parseInt(removeBtn.getAttribute('data-item-id'));
    
    e.preventDefault();
    
    // Show immediate feedback
    if (window.toast) {
      const t = languageManager.t.bind(languageManager);
      window.toast.success(t('cart.itemRemoved'));
    }
    
    // Remove from cart
    await cartManager.removeFromCart(itemId);
    
    // Re-render cart
    await renderCart();
    return;
  }
  
  // Handle quantity buttons
  const quantityBtn = target.closest('.quantity-btn');
  if (quantityBtn) {
    e.preventDefault();
    
    const action = quantityBtn.getAttribute('data-action');
    const itemId = parseInt(quantityBtn.getAttribute('data-item-id'));
    const cartItem = quantityBtn.closest('.cart-item');
    
    if (quantityBtn.disabled) return;
    
    await handleQuantityUpdate(itemId, action, cartItem);
    return;
  }
}

async function handleQuantityChange(e) {
  if (e.target.classList.contains('quantity-input')) {
    const input = e.target;
    const itemId = parseInt(input.getAttribute('data-item-id'));
    const newQuantity = parseInt(input.value);
    const cartItem = input.closest('.cart-item');
    
    await updateItemQuantity(itemId, newQuantity, cartItem);
  }
}

async function handleQuantityKeypress(e) {
  if (e.target.classList.contains('quantity-input') && e.key === 'Enter') {
    e.preventDefault();
    const input = e.target;
    const itemId = parseInt(input.getAttribute('data-item-id'));
    const newQuantity = parseInt(input.value);
    const cartItem = input.closest('.cart-item');
    
    await updateItemQuantity(itemId, newQuantity, cartItem);
  }
}

async function handleQuantityInput(e) {
  if (e.target.classList.contains('quantity-input')) {
    const input = e.target;
    const itemId = parseInt(input.getAttribute('data-item-id'));
    const newQty = parseInt(input.value);
    
    if (!isNaN(newQty) && newQty > 0) {
      const cartItems = cartManager.getCart();
      const item = cartItems.find(i => i.id === itemId);
      
      if (item) {
        const minQty = item.minOrder || 1;
        if (newQty >= minQty) {
          // Update in cart manager
          await cartManager.updateQuantity(itemId, newQty);
          
          // Update subtotal for this item
          const updatedCart = cartManager.getCart();
          const updatedItem = updatedCart.find(i => i.id === itemId);
          if (updatedItem) {
            const subtotalEl = input.closest('.cart-item').querySelector('.cart-item-subtotal .value');
            if (subtotalEl) {
              subtotalEl.textContent = `$${(updatedItem.price * updatedItem.quantity).toFixed(2)}`;
            }
            // Update cart summary
            updateCartSummary();
          }
        } else {
          // Reset to minimum if below min
          const minQty = item.minOrder || 1;
          if (window.toast) {
            const t = languageManager.t.bind(languageManager);
            window.toast.warning(`${t('cart.minOrderQuantity')} ${minQty}`);
          }
          input.value = minQty;
        }
      }
    }
  }
}

async function handleQuantityUpdate(itemId, action, cartItem) {
  const cartItems = cartManager.getCart();
  const item = cartItems.find(i => i.id === itemId);
  
  if (!item) return;
  
  const step = item.minOrder || 1;
  const currentQty = item.quantity;
  let newQuantity;
  
  if (action === 'increase') {
    newQuantity = currentQty + step;
  } else if (action === 'decrease') {
    newQuantity = currentQty - step;
  } else {
    return;
  }
  
  // Check minimum quantity
  if (newQuantity < step && action === 'decrease') {
    if (window.toast) {
      const t = languageManager.t.bind(languageManager);
      window.toast.warning(`${t('cart.minOrderQuantity')} ${step}`);
    }
    return;
  }
  
  // Update quantity
  await cartManager.updateQuantity(itemId, newQuantity);
  
  // Update UI
  updateCartItemUI(itemId, cartItem);
}

async function updateItemQuantity(itemId, newQuantity, cartItem) {
  const cartItems = cartManager.getCart();
  const item = cartItems.find(i => i.id === itemId);
  
  if (!item) return;
  
  const minQty = item.minOrder || 1;
  
  if (isNaN(newQuantity) || newQuantity < minQty) {
    if (window.toast) {
      const t = languageManager.t.bind(languageManager);
      window.toast.warning(`${t('cart.minOrderQuantity')} ${minQty}`);
    }
    // Reset to current quantity
    const input = cartItem.querySelector('.quantity-input');
    if (input) input.value = item.quantity;
    return;
  }
  
  // Round to nearest step
  const step = item.minOrder || 1;
  const roundedQty = Math.max(minQty, Math.round(newQuantity / step) * step);
  
  // Update quantity
  await cartManager.updateQuantity(itemId, roundedQty);
  
  // Update UI
  updateCartItemUI(itemId, cartItem);
  
  if (window.toast) {
    const t = languageManager.t.bind(languageManager);
    window.toast.success(t('cart.quantityUpdated'));
  }
}

function updateCartItemUI(itemId, cartItem) {
  const cartItems = cartManager.getCart();
  const item = cartItems.find(i => i.id === itemId);
  
  if (!item || !cartItem) return;
  
  // Update quantity input
  const quantityInput = cartItem.querySelector('.quantity-input');
  if (quantityInput) {
    quantityInput.value = item.quantity;
  }
  
  // Update subtotal
  const subtotalEl = cartItem.querySelector('.cart-item-subtotal .value');
  if (subtotalEl) {
    subtotalEl.textContent = `$${(item.price * item.quantity).toFixed(2)}`;
  }
  
  // Update cart summary
  updateCartSummary();
}

function updateCartSummary() {
  const total = cartManager.getCartTotal();
  
  const subtotalEl = document.getElementById('cart-subtotal');
  const taxEl = document.getElementById('cart-tax');
  const totalEl = document.getElementById('cart-total');
  
  if (subtotalEl) subtotalEl.textContent = `$${total.toFixed(2)}`;
  if (taxEl) taxEl.textContent = `$${(total * 0.1).toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${(total * 1.1).toFixed(2)}`;
}
