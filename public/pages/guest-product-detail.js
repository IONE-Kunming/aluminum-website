import router from '../js/router.js';
import dataService from '../js/dataService.js';
import { escapeHtml } from '../js/utils.js';
import languageManager from '../js/language.js';

export async function renderGuestProductDetail() {
  const t = languageManager.t.bind(languageManager);
  const app = document.getElementById('app');
  
  // Get product ID from URL query parameter
  const params = router.getQueryParams();
  const productId = params.id;
  
  if (!productId) {
    if (window.toast) {
      window.toast.error('Product not found');
    }
    router.navigate('/guest/catalog');
    return;
  }
  
  // Fetch product details
  const product = await dataService.getProductById(productId);
  
  if (!product) {
    if (window.toast) {
      window.toast.error('Product not found');
    }
    router.navigate('/guest/catalog');
    return;
  }
  
  app.innerHTML = `
    <div class="guest-product-detail-page" style="min-height: 100vh; background: var(--background-primary);">
      <!-- Simple Header -->
      <div class="public-header">
        <div class="header-container">
          <button class="back-btn" id="back-to-catalog">
            <i data-lucide="arrow-left"></i> Back to Products
          </button>
          <div class="header-actions">
            <button class="btn btn-secondary" data-nav="login">Login</button>
            <button class="btn btn-primary" data-nav="signup">Sign Up</button>
          </div>
        </div>
      </div>
      
      <div class="product-detail-page" style="padding: 48px 24px; max-width: 1400px; margin: 0 auto;">
        <div class="page-header" style="margin-bottom: 32px;">
          <div>
            <h1>${escapeHtml(product.modelNumber || product.name || 'Product')}</h1>
            <p class="product-category-badge" style="display: inline-block; padding: 4px 12px; background: var(--background-secondary); border-radius: 4px; font-size: 14px; margin-top: 8px;">${escapeHtml(product.category || 'Uncategorized')}</p>
          </div>
        </div>

        <div class="product-detail-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 48px;">
          <div class="product-image-section">
            ${product.imageUrl ? `
              <div class="product-image-wrapper" style="width: 100%; aspect-ratio: 1; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                <img 
                  src="${product.imageUrl}" 
                  alt="${escapeHtml(product.modelNumber || product.name || 'Product')}" 
                  style="width: 100%; height: 100%; object-fit: cover;"
                  onerror="this.onerror=null; this.style.display='none';"
                />
                <div style="display: none; flex-direction: column; align-items: center; color: white;">
                  <i data-lucide="image-off" style="width: 64px; height: 64px; opacity: 0.8;"></i>
                  <span style="opacity: 0.8; margin-top: 8px;">Image not available</span>
                </div>
              </div>
            ` : `
              <div class="product-image-wrapper" style="width: 100%; aspect-ratio: 1; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                <i data-lucide="package" style="width: 64px; height: 64px; color: white; opacity: 0.8;"></i>
                <span style="color: white; opacity: 0.8; margin-top: 8px;">No image</span>
              </div>
            `}
          </div>

          <div class="product-info-section">
            <div class="product-description card" style="margin-bottom: 24px;">
              <h2>${t('catalog.description')}</h2>
              <p style="margin-top: 12px; line-height: 1.6;">${escapeHtml(product.description || 'No description available')}</p>
            </div>

            <div class="product-details card" style="margin-bottom: 24px;">
              <h2>${t('catalog.productDetails')}</h2>
              <div class="details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px;">
                <div class="detail-item">
                  <span class="detail-label" style="font-weight: 500; color: var(--text-secondary);">${t('catalog.price')}</span>
                  <span class="detail-value" style="font-size: 18px; font-weight: 600; color: var(--text-primary);">$${parseFloat(product.pricePerMeter || product.price || 0).toFixed(2)}/${escapeHtml(product.unit || 'unit')}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label" style="font-weight: 500; color: var(--text-secondary);">${t('catalog.minOrder')}</span>
                  <span class="detail-value" style="font-size: 18px; font-weight: 600; color: var(--text-primary);">${product.minOrder || 1} ${escapeHtml(product.unit || 'unit')}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label" style="font-weight: 500; color: var(--text-secondary);">${t('catalog.stock')}</span>
                  <span class="detail-value" style="font-size: 18px; font-weight: 600; color: var(--text-primary);">${product.stock || 'Available'}</span>
                </div>
                ${product.color ? `
                  <div class="detail-item">
                    <span class="detail-label" style="font-weight: 500; color: var(--text-secondary);">${t('products.color')}</span>
                    <span class="detail-value" style="font-size: 18px; font-weight: 600; color: var(--text-primary);">${escapeHtml(product.color)}</span>
                  </div>
                ` : ''}
                ${product.finish ? `
                  <div class="detail-item">
                    <span class="detail-label" style="font-weight: 500; color: var(--text-secondary);">${t('products.finish')}</span>
                    <span class="detail-value" style="font-size: 18px; font-weight: 600; color: var(--text-primary);">${escapeHtml(product.finish)}</span>
                  </div>
                ` : ''}
                ${product.thickness ? `
                  <div class="detail-item">
                    <span class="detail-label" style="font-weight: 500; color: var(--text-secondary);">${t('products.thickness')}</span>
                    <span class="detail-value" style="font-size: 18px; font-weight: 600; color: var(--text-primary);">${escapeHtml(product.thickness)} mm</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="guest-cta-card card" style="padding: 24px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
              <h3 style="color: white; margin-bottom: 8px;">${t('guest.wantToOrder') || 'Want to order this product?'}</h3>
              <p style="margin-bottom: 16px; opacity: 0.9;">${t('guest.signInPrompt') || 'Sign in or create an account to add products to your cart and place orders'}</p>
              <div style="display: flex; gap: 12px; justify-content: center;">
                <button class="btn btn-secondary" data-nav="login" style="background: white; color: var(--dark-bg);">Login</button>
                <button class="btn btn-primary" data-nav="signup" style="background: var(--dark-bg); color: white;">Sign Up</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add event listener for back button
  document.getElementById('back-to-catalog')?.addEventListener('click', () => {
    window.history.back();
  });

  // Add event listeners for navigation buttons
  app.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const page = btn.getAttribute('data-nav');
      router.navigate(`/${page}`);
    });
  });

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
