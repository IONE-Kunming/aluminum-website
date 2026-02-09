import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import authManager from '../js/auth.js';
import cartManager from '../js/cart.js';
import dataService from '../js/dataService.js';
import { escapeHtml } from '../js/utils.js';
import languageManager from '../js/language.js';

// Constants
const CM_TO_METERS = 100;
const ZOOM_LENS_SIZE = 100; // pixels

export async function renderProductDetail() {
  const t = languageManager.t.bind(languageManager);
  const profile = authManager.getUserProfile();
  
  // Get product ID from URL query parameter
  const params = router.getQueryParams();
  const productId = params.id;
  
  if (!productId) {
    window.toast.error('Product not found');
    router.navigate('/buyer/catalog');
    return;
  }
  
  // Fetch product details
  const product = await dataService.getProductById(productId);
  
  if (!product) {
    window.toast.error('Product not found');
    router.navigate('/buyer/catalog');
    return;
  }
  
  const content = `
    <div class="product-detail-page">
      <div class="page-header">
        <button class="btn btn-secondary back-btn" id="back-to-catalog">
          <i data-lucide="arrow-left"></i>
          ${t('common.back')}
        </button>
        <div>
          <h1>${escapeHtml(product.modelNumber || product.name || 'Product')}</h1>
          <p class="product-category-badge">${escapeHtml(product.category || 'Uncategorized')}</p>
        </div>
      </div>

      <div class="product-detail-container">
        <div class="product-image-section">
          ${product.imageUrl ? `
            <div class="product-image-wrapper">
              <img 
                src="${product.imageUrl}" 
                alt="${escapeHtml(product.modelNumber || product.name || 'Product')}" 
                class="product-detail-image"
                id="product-image"
                onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';"
              />
              <div class="product-image-placeholder" style="display: none;">
                <i data-lucide="image-off" style="width: 64px; height: 64px; color: white; opacity: 0.8;"></i>
                <span style="color: white; opacity: 0.8; margin-top: 8px;">Image not available</span>
              </div>
            </div>
          ` : `
            <div class="product-image-wrapper">
              <div class="product-image-placeholder">
                <i data-lucide="package" style="width: 64px; height: 64px; color: white; opacity: 0.8;"></i>
                <span style="color: white; opacity: 0.8; margin-top: 8px;">No image</span>
              </div>
            </div>
          `}
        </div>

        <div class="product-info-section">
          <div class="product-description card">
            <h2>${t('catalog.description')}</h2>
            <p>${escapeHtml(product.description || 'No description available')}</p>
          </div>

          <div class="product-details card">
            <h2>${t('catalog.details')}</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">${t('catalog.seller')}:</span>
                <span class="detail-value">${escapeHtml(product.sellerName || 'Unknown Seller')}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">${t('catalog.price')}:</span>
                <span class="detail-value">$${product.pricePerMeter || product.price || 0}/${escapeHtml(product.unit || 'unit')}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">${t('catalog.minOrder')}:</span>
                <span class="detail-value">${product.minOrder || 1} ${escapeHtml(product.unit || 'unit')}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">${t('catalog.stock')}:</span>
                <span class="detail-value">${product.stock || 'Available'}</span>
              </div>
            </div>
          </div>

          <div class="product-order-form card">
            <h2>${t('catalog.orderDetails')}</h2>
            <form id="add-to-cart-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="dimension-length">${t('cart.length')} (cm) *</label>
                  <input 
                    type="number" 
                    id="dimension-length" 
                    class="form-control" 
                    min="0" 
                    step="0.01" 
                    placeholder="0.00" 
                    required
                  />
                </div>
                <div class="form-group">
                  <label for="dimension-width">${t('cart.width')} (cm) *</label>
                  <input 
                    type="number" 
                    id="dimension-width" 
                    class="form-control" 
                    min="0" 
                    step="0.01" 
                    placeholder="0.00" 
                    required
                  />
                </div>
              </div>
              
              <div class="form-group">
                <label for="quantity">${t('cart.quantity')} *</label>
                <div class="quantity-input-group">
                  <button type="button" class="quantity-btn" id="decrease-qty">
                    <i data-lucide="minus"></i>
                  </button>
                  <input 
                    type="number" 
                    id="quantity" 
                    class="form-control quantity-input" 
                    min="${product.minOrder || 1}" 
                    step="${product.minOrder || 1}"
                    value="${product.minOrder || 1}"
                    required
                  />
                  <button type="button" class="quantity-btn" id="increase-qty">
                    <i data-lucide="plus"></i>
                  </button>
                </div>
                <small class="form-text">${t('catalog.minOrder')}: ${product.minOrder || 1} ${escapeHtml(product.unit || 'unit')}</small>
              </div>

              <button type="submit" class="btn btn-primary btn-large" id="add-to-cart-btn">
                <i data-lucide="shopping-cart"></i>
                ${t('catalog.addToCart')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');

  // Back button
  const backBtn = document.getElementById('back-to-catalog');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      router.navigate('/buyer/catalog');
    });
  }

  // Image zoom functionality
  const productImage = document.getElementById('product-image');
  if (productImage) {
    const imageWrapper = productImage.parentElement;
    
    // Create zoom lens element
    const zoomLens = document.createElement('div');
    zoomLens.className = 'zoom-lens';
    zoomLens.style.display = 'none';
    imageWrapper.appendChild(zoomLens);
    
    imageWrapper.addEventListener('mouseenter', () => {
      imageWrapper.classList.add('zoom-active');
    });
    
    imageWrapper.addEventListener('mouseleave', () => {
      imageWrapper.classList.remove('zoom-active');
      zoomLens.style.display = 'none';
    });
    
    imageWrapper.addEventListener('mousemove', (e) => {
      const rect = imageWrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate zoom position
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;
      
      // Update image transform origin for zoom effect
      productImage.style.transformOrigin = `${xPercent}% ${yPercent}%`;
      
      // Show and position zoom lens
      const lensOffset = ZOOM_LENS_SIZE / 2;
      zoomLens.style.display = 'block';
      zoomLens.style.left = `${x - lensOffset}px`;
      zoomLens.style.top = `${y - lensOffset}px`;
    });
  }

  // Quantity controls
  const quantityInput = document.getElementById('quantity');
  const decreaseBtn = document.getElementById('decrease-qty');
  const increaseBtn = document.getElementById('increase-qty');
  const minOrder = product.minOrder || 1;

  if (decreaseBtn) {
    decreaseBtn.addEventListener('click', () => {
      const currentValue = parseInt(quantityInput.value) || minOrder;
      const newValue = currentValue - minOrder;
      if (newValue >= minOrder) {
        quantityInput.value = newValue;
      } else {
        window.toast.warning(`${t('cart.minOrderQuantity')} ${minOrder}`);
      }
    });
  }

  if (increaseBtn) {
    increaseBtn.addEventListener('click', () => {
      const currentValue = parseInt(quantityInput.value) || minOrder;
      quantityInput.value = currentValue + minOrder;
    });
  }

  // Add to cart form submission
  const form = document.getElementById('add-to-cart-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const length = parseFloat(document.getElementById('dimension-length').value);
      const width = parseFloat(document.getElementById('dimension-width').value);
      const quantity = parseInt(quantityInput.value);
      
      // Validate dimensions
      if (isNaN(length) || !isFinite(length) || length <= 0) {
        window.toast.error(t('cart.pleaseEnterValidDimensions'));
        return;
      }
      
      if (isNaN(width) || !isFinite(width) || width <= 0) {
        window.toast.error(t('cart.pleaseEnterValidDimensions'));
        return;
      }
      
      // Validate quantity
      if (isNaN(quantity) || quantity < minOrder) {
        window.toast.error(`${t('cart.minOrderQuantity')} ${minOrder}`);
        return;
      }
      
      // Validate product has sellerId
      if (!product.sellerId || product.sellerId === '') {
        window.toast.error('This product is missing seller information and cannot be added to cart. Please contact support.');
        console.error('Product missing sellerId:', product);
        return;
      }
      
      // Convert cm to meters for storage
      const lengthInMeters = length / CM_TO_METERS;
      const widthInMeters = width / CM_TO_METERS;
      
      // Create a unique cart item ID that includes dimensions
      const cartItemId = `${product.id}_${lengthInMeters}_${widthInMeters}`;
      
      // Normalize product data for cart
      const cartProduct = {
        ...product,
        cartItemId: cartItemId,
        productId: product.id,
        name: product.modelNumber || product.name || 'Product',
        seller: product.sellerName || 'Unknown Seller',
        sellerId: product.sellerId,
        price: product.pricePerMeter || product.price || 0,
        unit: product.unit || 'unit',
        minOrder: product.minOrder || 1,
        dimensions: {
          length: lengthInMeters,
          width: widthInMeters
        }
      };
      
      // Add to cart
      await cartManager.addToCart(cartProduct, quantity);
      
      // Show success message
      window.toast.success(t('cart.itemAdded'));
      
      // Navigate to cart
      router.navigate('/buyer/cart');
    });
  }

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
