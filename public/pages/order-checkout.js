import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import { escapeHtml } from '../js/utils.js';
import languageManager from '../js/language.js';

export async function renderOrderCheckout() {
  const t = languageManager.t.bind(languageManager);
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');
  
  if (!orderId) {
    router.navigate('/buyer/orders');
    return;
  }
  
  // Fetch the order
  const order = await dataService.getOrderById(orderId);
  
  if (!order || order.status !== 'draft') {
    window.toast.error(t('orders.orderNotFound') || 'Order not found or already checked out');
    router.navigate('/buyer/orders');
    return;
  }
  
  const content = `
    <div class="order-checkout-page">
      <div class="page-header">
        <h1>${t('orders.checkoutOrder') || 'Checkout Order'}</h1>
        <p>${t('orders.completePayment') || 'Complete payment for this order'}</p>
      </div>

      <div class="checkout-container">
        <!-- Order Summary -->
        <div class="checkout-section card">
          <h2>${t('checkout.orderSummary')}</h2>
          <div class="checkout-items">
            ${order.items.map(item => `
              <div class="checkout-item">
                <div class="checkout-item-info">
                  <h4>${escapeHtml(item.productName)}</h4>
                  <p class="text-muted">${escapeHtml(item.seller)}</p>
                </div>
                <div class="checkout-item-details">
                  <span>${item.quantity} ${escapeHtml(item.unit || 'units')}</span>
                  <span class="checkout-item-price">$${item.subtotal.toFixed(2)}</span>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="checkout-totals">
            <div class="checkout-total-row">
              <span>${t('checkout.subtotal')}:</span>
              <span>$${order.subtotal.toFixed(2)}</span>
            </div>
            <div class="checkout-total-row">
              <span>${t('checkout.tax')} (10%):</span>
              <span>$${order.tax.toFixed(2)}</span>
            </div>
            <div class="checkout-total-row total">
              <span>${t('checkout.total')}:</span>
              <span id="order-total">$${order.total.toFixed(2)}</span>
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
                <div class="deposit-amount">$${(order.total * 0.05).toFixed(2)}</div>
                <div class="deposit-label">${t('checkout.minimumDeposit')}</div>
              </div>
            </label>
            
            <label class="deposit-option">
              <input type="radio" name="deposit" value="30" data-percentage="30" />
              <div class="deposit-card">
                <div class="deposit-percentage">30%</div>
                <div class="deposit-amount">$${(order.total * 0.30).toFixed(2)}</div>
                <div class="deposit-label">${t('checkout.standardDeposit')}</div>
              </div>
            </label>
            
            <label class="deposit-option">
              <input type="radio" name="deposit" value="65" data-percentage="65" />
              <div class="deposit-card">
                <div class="deposit-percentage">65%</div>
                <div class="deposit-amount">$${(order.total * 0.65).toFixed(2)}</div>
                <div class="deposit-label">${t('checkout.premiumDeposit')}</div>
              </div>
            </label>
            
            <label class="deposit-option">
              <input type="radio" name="deposit" value="100" data-percentage="100" />
              <div class="deposit-card">
                <div class="deposit-percentage">100%</div>
                <div class="deposit-amount">$${order.total.toFixed(2)}</div>
                <div class="deposit-label">${t('checkout.fullPayment')}</div>
              </div>
            </label>
          </div>
          
          <div id="deposit-summary" style="margin-top: 24px; padding: 16px; background: var(--background-secondary); border-radius: 8px; display: none;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>${t('checkout.depositAmountLabel')}:</span>
              <span id="deposit-amount-display" style="font-weight: bold; color: var(--success-color);">$0.00</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>${t('checkout.remainingBalance')}:</span>
              <span id="remaining-balance-display" style="font-weight: bold; color: var(--warning-color);">$0.00</span>
            </div>
          </div>
        </div>

        <!-- Payment Method Selection -->
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
          <button class="btn btn-secondary" id="back-to-orders-btn">
            <i data-lucide="arrow-left"></i>
            ${t('orders.backToOrders') || 'Back to Orders'}
          </button>
          <button class="btn btn-primary" id="confirm-payment-btn" disabled>
            <i data-lucide="check-circle"></i>
            ${t('orders.confirmPayment') || 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  
  if (window.lucide) window.lucide.createIcons();
  
  // Initialize checkout functionality
  initializeOrderCheckout(order);
}

function initializeOrderCheckout(order) {
  const t = languageManager.t.bind(languageManager);
  const depositOptions = document.querySelectorAll('input[name="deposit"]');
  const paymentOptions = document.querySelectorAll('input[name="payment"]');
  const confirmBtn = document.getElementById('confirm-payment-btn');
  const backBtn = document.getElementById('back-to-orders-btn');
  const depositSummary = document.getElementById('deposit-summary');
  const depositAmountDisplay = document.getElementById('deposit-amount-display');
  const remainingBalanceDisplay = document.getElementById('remaining-balance-display');
  
  let selectedDeposit = null;
  let selectedPayment = null;
  
  const orderTotal = order.total;
  
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
  
  // Back to orders
  backBtn.addEventListener('click', () => {
    router.navigate('/buyer/orders');
  });
  
  // Confirm payment
  confirmBtn.addEventListener('click', async () => {
    if (!selectedDeposit || !selectedPayment) {
      window.toast.warning(t('checkout.selectDepositAndPayment'));
      return;
    }
    
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<i data-lucide="loader"></i> ${t('checkout.processing')}`;
    if (window.lucide) window.lucide.createIcons();
    
    try {
      // Simulate payment processing
      await processPayment(selectedPayment, orderTotal, selectedDeposit);
      
      // Update order with deposit and payment info
      const depositAmount = orderTotal * (selectedDeposit / 100);
      const remainingBalance = orderTotal - depositAmount;
      
      await dataService.updateOrderStatus(order.id, {
        status: 'pending',
        paymentStatus: 'deposit_paid',
        depositPercentage: selectedDeposit,
        depositAmount: depositAmount,
        remainingBalance: remainingBalance,
        paymentMethod: selectedPayment
      });
      
      // Create invoice for the order
      try {
        await dataService.createInvoice(order.id);
        console.log('Invoice created for order:', order.id);
      } catch (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        // Continue even if invoice creation fails
      }
      
      // Show success message
      window.toast.success(t('orders.paymentSuccessful') || 'Payment successful! Order confirmed.');
      
      // Navigate back to orders
      setTimeout(() => {
        router.navigate('/buyer/orders');
      }, 2000);
      
    } catch (error) {
      console.error('Error processing payment:', error);
      window.toast.error(t('orders.paymentFailed') || 'Payment failed. Please try again.');
      
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `<i data-lucide="check-circle"></i> ${t('orders.confirmPayment') || 'Confirm Payment'}`;
      if (window.lucide) window.lucide.createIcons();
    }
  });
}

// Mock payment processing
async function processPayment(method, amount, depositPercentage) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Processing ${method} payment for $${(amount * depositPercentage / 100).toFixed(2)}`);
      resolve({ success: true, transactionId: `TXN${Date.now()}` });
    }, 1500);
  });
}
