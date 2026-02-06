import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';

export function renderCart() {
  const content = `
    <div class="cart-page">
      <div class="page-header">
        <h1>Shopping Cart</h1>
        <p>Review your items before checkout</p>
      </div>

      <div class="cart-empty">
        <i data-lucide="shopping-cart" style="width: 64px; height: 64px; opacity: 0.3;"></i>
        <h2>Your cart is empty</h2>
        <p>Browse our catalog to add products to your cart</p>
        <button class="btn btn-primary" data-nav="/buyer/catalog">
          Browse Catalog
        </button>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');

  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      router.navigate(btn.getAttribute('data-nav'));
    });
  });

  if (window.lucide) window.lucide.createIcons();
}
