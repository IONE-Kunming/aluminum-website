import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import cartManager from '../js/cart.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml } from '../js/utils.js';
import languageManager from '../js/language.js';

export async function renderCheckout() {
  const t = languageManager.t.bind(languageManager);
  const cartItems = cartManager.getCart();
  const cartTotal = cartManager.getCartTotal();
  
  if (cartItems.length === 0) {
    router.navigate('/buyer/cart');
    return;
  }
  
  // Validate all products before checkout
  const productIds = cartItems.map(item => item.id.toString());
  const productValidation = await dataService.validateProducts(productIds);
  const hasUnavailableItems = Object.values(productValidation).some(isValid => !isValid);
  
  // If there are unavailable items, redirect back to cart with a message
  if (hasUnavailableItems) {
    window.toast.error(t('cart.someItemsUnavailable'));
    router.navigate('/buyer/cart');
    return;
  }
  
  const content = `
    <div class="checkout-page">
      <div class="page-header">
        <h1>${t('checkout.title')}</h1>
        <p>${t('checkout.subtitle')}</p>
      </div>

      <div class="checkout-container">
        <!-- Order Summary -->
        <div class="checkout-section card">
          <h2>${t('checkout.orderSummary')}</h2>
          <div class="checkout-items">
            ${cartItems.map(item => `
              <div class="checkout-item">
                <div class="checkout-item-info">
                  <h4>${escapeHtml(item.modelNumber || item.name)}</h4>
                  <p class="text-muted">${escapeHtml(item.seller)}</p>
                </div>
                <div class="checkout-item-details">
                  <span>${item.quantity} ${escapeHtml(item.unit || t('checkout.units'))}</span>
                  <span class="checkout-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="checkout-totals">
            <div class="checkout-total-row">
              <span>${t('checkout.subtotal')}:</span>
              <span>$${cartTotal.toFixed(2)}</span>
            </div>
            <div class="checkout-total-row">
              <span>${t('checkout.tax')} (10%):</span>
              <span>$${(cartTotal * 0.1).toFixed(2)}</span>
            </div>
            <div class="checkout-total-row total">
              <span>${t('checkout.total')}:</span>
              <span id="order-total">$${(cartTotal * 1.1).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Deposit Selection -->
        <div class="checkout-section card">
          <h2>${t('checkout.depositAmount')} <span class="required-badge">${t('checkout.required')}</span></h2>
          <p class="section-description">${t('checkout.selectDeposit')}</p>
          
          <div class="deposit-options">
            <label class="deposit-option">
              <input type="radio" name="deposit" value="5" data-percentage="5" />
              <div class="deposit-card">
                <div class="deposit-percentage">5%</div>
                <div class="deposit-amount">$${(cartTotal * 1.1 * 0.05).toFixed(2)}</div>
                <div class="deposit-label">${t('checkout.minimumDeposit')}</div>
              </div>
            </label>
            
            <label class="deposit-option">
              <input type="radio" name="deposit" value="30" data-percentage="30" />
              <div class="deposit-card">
                <div class="deposit-percentage">30%</div>
                <div class="deposit-amount">$${(cartTotal * 1.1 * 0.30).toFixed(2)}</div>
                <div class="deposit-label">${t('checkout.standardDeposit')}</div>
              </div>
            </label>
            
            <label class="deposit-option">
              <input type="radio" name="deposit" value="65" data-percentage="65" />
              <div class="deposit-card">
                <div class="deposit-percentage">65%</div>
                <div class="deposit-amount">$${(cartTotal * 1.1 * 0.65).toFixed(2)}</div>
                <div class="deposit-label">${t('checkout.premiumDeposit')}</div>
              </div>
            </label>
          </div>
          
          <div id="deposit-summary" class="deposit-summary" style="display: none;">
            <div class="summary-row">
              <span>${t('checkout.depositAmountLabel')}:</span>
              <span id="deposit-amount-display">$0.00</span>
            </div>
            <div class="summary-row">
              <span>${t('checkout.remainingBalance')}:</span>
              <span id="remaining-balance-display">$${(cartTotal * 1.1).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Payment Method -->
        <div class="checkout-section card">
          <h2>${t('checkout.paymentMethod')} <span class="required-badge">${t('checkout.required')}</span></h2>
          <p class="section-description">${t('checkout.selectPaymentMethod')}</p>
          
          <div class="payment-methods">
            <label class="payment-method">
              <input type="radio" name="payment" value="alipay" />
              <div class="payment-card">
                <div class="payment-icon">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect width="40" height="40" rx="8" fill="#1677FF"/>
                    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="18" font-weight="bold">支</text>
                  </svg>
                </div>
                <div class="payment-name">${t('checkout.alipay')}</div>
              </div>
            </label>
            
            <label class="payment-method">
              <input type="radio" name="payment" value="wechat" />
              <div class="payment-card">
                <div class="payment-icon">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect width="40" height="40" rx="8" fill="#09B83E"/>
                    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="18" font-weight="bold">微</text>
                  </svg>
                </div>
                <div class="payment-name">${t('checkout.wechat')}</div>
              </div>
            </label>
            
            <label class="payment-method">
              <input type="radio" name="payment" value="bank" />
              <div class="payment-card">
                <div class="payment-icon">
                  <i data-lucide="landmark" style="width: 24px; height: 24px; color: #6366f1;"></i>
                </div>
                <div class="payment-name">${t('checkout.bankTransfer')}</div>
              </div>
            </label>
            
            <label class="payment-method">
              <input type="radio" name="payment" value="card" />
              <div class="payment-card">
                <div class="payment-icon">
                  <i data-lucide="credit-card" style="width: 24px; height: 24px; color: #6366f1;"></i>
                </div>
                <div class="payment-name">${t('checkout.cardPayment')}</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="checkout-actions">
          <button class="btn btn-secondary" id="back-to-cart-btn">
            <i data-lucide="arrow-left"></i>
            ${t('checkout.backToCart')}
          </button>
          <button class="btn btn-primary" id="confirm-order-btn" disabled>
            <i data-lucide="check-circle"></i>
            ${t('checkout.confirmOrder')}
          </button>
        </div>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  
  if (window.lucide) window.lucide.createIcons();
  
  // Initialize checkout functionality
  initializeCheckout(cartItems, cartTotal);
}

function initializeCheckout(cartItems, cartTotal) {
  const t = languageManager.t.bind(languageManager);
  const depositOptions = document.querySelectorAll('input[name="deposit"]');
  const paymentOptions = document.querySelectorAll('input[name="payment"]');
  const confirmBtn = document.getElementById('confirm-order-btn');
  const backBtn = document.getElementById('back-to-cart-btn');
  const depositSummary = document.getElementById('deposit-summary');
  const depositAmountDisplay = document.getElementById('deposit-amount-display');
  const remainingBalanceDisplay = document.getElementById('remaining-balance-display');
  
  let selectedDeposit = null;
  let selectedPayment = null;
  
  const orderTotal = cartTotal * 1.1;
  
  // Handle deposit selection
  depositOptions.forEach(option => {
    option.addEventListener('change', () => {
      selectedDeposit = parseInt(option.value);
      const depositAmount = orderTotal * (selectedDeposit / 100);
      const remainingBalance = orderTotal - depositAmount;
      
      depositAmountDisplay.textContent = `$${depositAmount.toFixed(2)}`;
      remainingBalanceDisplay.textContent = `$${remainingBalance.toFixed(2)}`;
      depositSummary.style.display = 'block';
      
      // Highlight selected option
      document.querySelectorAll('.deposit-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      option.closest('.deposit-option').classList.add('selected');
      
      checkFormComplete();
    });
  });
  
  // Handle payment method selection
  paymentOptions.forEach(option => {
    option.addEventListener('change', () => {
      selectedPayment = option.value;
      
      // Highlight selected option
      document.querySelectorAll('.payment-method').forEach(opt => {
        opt.classList.remove('selected');
      });
      option.closest('.payment-method').classList.add('selected');
      
      checkFormComplete();
    });
  });
  
  // Check if form is complete
  function checkFormComplete() {
    if (selectedDeposit && selectedPayment) {
      confirmBtn.disabled = false;
    } else {
      confirmBtn.disabled = true;
    }
  }
  
  // Back to cart
  backBtn.addEventListener('click', () => {
    router.navigate('/buyer/cart');
  });
  
  // Confirm order
  confirmBtn.addEventListener('click', async () => {
    if (!selectedDeposit || !selectedPayment) {
      window.toast.warning(t('checkout.selectDepositAndPayment'));
      return;
    }
    
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<i data-lucide="loader"></i> ${t('checkout.processing')}`;
    if (window.lucide) window.lucide.createIcons();
    
    try {
      // Simulate payment processing (mock)
      await processPayment(selectedPayment, orderTotal, selectedDeposit);
      
      // Create order in database
      const user = authManager.getCurrentUser();
      const userProfile = authManager.getUserProfile();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Group items by seller to create separate orders for each seller
      const itemsBySeller = {};
      
      // Validate all items have sellerId before proceeding
      const invalidItems = cartItems.filter(item => !item.sellerId || item.sellerId === '');
      if (invalidItems.length > 0) {
        console.error('Items without seller ID:', invalidItems);
        throw new Error('Some items in cart are missing seller information. Please remove them and try again.');
      }
      
      cartItems.forEach(item => {
        const sellerId = item.sellerId;
        if (!itemsBySeller[sellerId]) {
          itemsBySeller[sellerId] = [];
        }
        itemsBySeller[sellerId].push(item);
      });
      
      // Create separate order for each seller
      const orderPromises = Object.entries(itemsBySeller).map(async ([sellerId, items]) => {
        const sellerSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const sellerTax = sellerSubtotal * 0.1;
        const sellerTotal = sellerSubtotal + sellerTax;
        const sellerDepositAmount = sellerTotal * (selectedDeposit / 100);
        const sellerRemainingBalance = sellerTotal - sellerDepositAmount;
        
        const orderData = {
          buyerId: user.uid,
          buyerName: userProfile?.displayName || user.displayName || 'Unknown',
          buyerEmail: userProfile?.email || user.email,
          buyerCompany: userProfile?.companyName || 'N/A',
          sellerId: sellerId,
          sellerName: items[0]?.seller || items[0]?.sellerName || 'Unknown Seller',
          items: items.map(item => {
            // Validate and sanitize cart item data
            const quantity = Number(item.quantity) || 0;
            const pricePerUnit = Number(item.price) || 0;
            
            if (quantity <= 0 || pricePerUnit < 0) {
              throw new Error('Invalid cart item data');
            }
            
            return {
              productId: item.id,
              productName: item.name || item.modelNumber,
              seller: item.seller || item.sellerName,
              sellerId: item.sellerId,
              quantity: quantity,
              unit: item.unit || 'units',
              pricePerUnit: pricePerUnit,
              subtotal: pricePerUnit * quantity
            };
          }),
          subtotal: sellerSubtotal,
          tax: sellerTax,
          total: sellerTotal,
          depositPercentage: selectedDeposit,
          depositAmount: sellerDepositAmount,
          remainingBalance: sellerRemainingBalance,
          paymentMethod: selectedPayment,
          status: 'pending',
          paymentStatus: 'deposit_paid',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Save order to Firestore
        return dataService.createOrder(orderData);
      });
      
      // Wait for all orders to be created
      await Promise.all(orderPromises);
      
      // Clear cart
      await cartManager.clearCart();
      
      // Show success message
      window.toast.success(t('checkout.orderPlaced'));
      
      // Redirect to orders page
      setTimeout(() => {
        router.navigate('/buyer/orders');
      }, 1500);
      
    } catch (error) {
      console.error('Error placing order:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        user: authManager.getCurrentUser()?.uid,
        cartItems: cartItems.length
      });
      
      // Show more specific error message if available
      const errorMessage = error.message || t('checkout.orderFailed');
      window.toast.error(errorMessage);
      
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `<i data-lucide="check-circle"></i> ${t('checkout.confirmOrder')}`;
      if (window.lucide) window.lucide.createIcons();
    }
  });
}

// Mock payment processing
async function processPayment(method, amount, depositPercentage) {
  // Simulate payment gateway delay
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Processing ${method} payment for $${(amount * depositPercentage / 100).toFixed(2)}`);
      resolve({ success: true, transactionId: `TXN${Date.now()}` });
    }, 1500);
  });
}
