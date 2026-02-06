import { renderPageWithLayout } from '../js/layout.js';

export function renderProducts() {
  const content = `
    <div class="products-page">
      <div class="page-header">
        <h1>My Products</h1>
        <p>Manage your product listings</p>
        <button class="btn btn-primary">
          <i data-lucide="plus"></i>
          Add Product
        </button>
      </div>

      <div class="empty-state">
        <i data-lucide="package" style="width: 64px; height: 64px; opacity: 0.3;"></i>
        <h2>No products yet</h2>
        <p>Start by adding your first product</p>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'seller');
  if (window.lucide) window.lucide.createIcons();
}
