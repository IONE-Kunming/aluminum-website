import router from '../js/router.js';
import { escapeHtml } from '../js/utils.js';
import languageManager from '../js/language.js';
import dataService from '../js/dataService.js';
import { 
  isMainCategory, 
  isSubcategory, 
  getSubcategories,
  getMainCategories,
  getMainCategoryForSubcategory,
  CATEGORY_HIERARCHY
} from '../js/categoryHierarchy.js';

// Helper function to translate category names
function translateCategory(category, t) {
  if (!category) return '';
  // Try to get translation from categoryNames, fallback to original if not found
  const translationKey = `categoryNames.${category}`;
  const translated = t(translationKey);
  // If translation not found, t() returns the key itself, so check if it matches the key
  return translated === translationKey ? category : translated;
}

export async function renderGuestCatalog() {
  const t = languageManager.t.bind(languageManager);
  const app = document.getElementById('app');
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get('category');
  const mainCategory = urlParams.get('mainCategory');
  
  // If category is provided, check if it's main or sub
  if (category) {
    if (isMainCategory(category)) {
      // Show subcategories for this main category
      await renderGuestSubcategorySelection(category, t, app);
    } else if (isSubcategory(category)) {
      // Show products for this subcategory (skip seller selection)
      await renderGuestProducts(category, t, app);
    } else {
      // Treat as a regular category (backward compatibility)
      await renderGuestProducts(category, t, app);
    }
    return;
  }
  
  // If mainCategory is provided (for direct subcategory navigation)
  if (mainCategory) {
    await renderGuestSubcategorySelection(mainCategory, t, app);
    return;
  }
  
  // Otherwise, show main category tiles
  await renderGuestMainCategoryTiles(t, app);
}

// Render main category tiles - first view of guest product catalogue
async function renderGuestMainCategoryTiles(t, app) {
  const hierarchyData = await dataService.getCategoriesHierarchy();
  const { mainCategories, unmappedCategories } = hierarchyData;
  
  // Combine main categories with unmapped ones (for backward compatibility)
  const allCategories = [...mainCategories, ...unmappedCategories];
  
  const renderCategories = (categoriesToRender) => {
    const categoriesGrid = document.querySelector('.categories-grid');
    if (!categoriesGrid) return;

    if (categoriesToRender.length === 0) {
      categoriesGrid.innerHTML = `
        <div class="empty-state">
          <i data-lucide="folder-open" style="width: 64px; height: 64px; opacity: 0.3; margin-bottom: 16px;"></i>
          <p>${t('catalog.noCategories')}</p>
        </div>
      `;
    } else {
      categoriesGrid.innerHTML = categoriesToRender.map(category => `
        <div class="category-tile card" data-category="${escapeHtml(category)}" style="cursor: pointer;">
          <div class="category-icon" style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <i data-lucide="box" style="width: 40px; height: 40px; color: white;"></i>
          </div>
          <h3 style="text-align: center; margin-bottom: 8px; font-size: 18px;">${escapeHtml(translateCategory(category, t))}</h3>
          <p style="text-align: center; color: var(--text-secondary); font-size: 14px;">
            ${isMainCategory(category) ? t('catalog.viewSubcategories') || 'View subcategories' : t('catalog.browseProducts') || 'Browse products'}
          </p>
        </div>
      `).join('');
    }

    // Add event listeners
    document.querySelectorAll('.category-tile[data-category]').forEach(tile => {
      tile.addEventListener('click', () => {
        const category = tile.getAttribute('data-category');
        router.navigate(`/guest/catalog?category=${encodeURIComponent(category)}`);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  };

  app.innerHTML = `
    <div class="guest-catalog-page" style="min-height: 100vh; background: var(--background-primary);">
      <!-- Simple Header -->
      <div class="public-header">
        <div class="header-container">
          <button class="back-btn" id="back-to-landing">
            <i data-lucide="arrow-left"></i> Back to Home
          </button>
          <div class="header-actions">
            <button class="btn btn-secondary" data-nav="login">Login</button>
            <button class="btn btn-primary" data-nav="signup">Sign Up</button>
          </div>
        </div>
      </div>
      
      <div class="catalog-page" style="padding: 48px 24px; max-width: 1400px; margin: 0 auto;">
        <div class="page-header" style="text-align: center; margin-bottom: 48px;">
          <h1>${t('catalog.title')}</h1>
          <p>${t('catalog.selectCategory')}</p>
        </div>

        <div class="catalog-controls" style="margin-bottom: 24px;">
          <input type="text" id="search-input" placeholder="${t('common.search')} ${t('catalog.categories').toLowerCase()}..." class="form-control">
        </div>

        <div class="categories-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 24px;">
          <!-- Categories will be rendered here -->
        </div>
        
        <div style="text-align: center; margin-top: 48px; padding: 24px; background: var(--background-secondary); border-radius: 8px;">
          <p style="margin-bottom: 12px; font-size: 16px; font-weight: 500;">Ready to place orders?</p>
          <p style="margin-bottom: 16px;">Sign in or create an account to add products to cart and checkout</p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button class="btn btn-secondary" data-nav="login">Login</button>
            <button class="btn btn-primary" data-nav="signup">Sign Up</button>
          </div>
        </div>
      </div>
    </div>
  `;

  renderCategories(allCategories);

  // Add event listener for back button
  document.getElementById('back-to-landing')?.addEventListener('click', () => {
    router.navigate('/');
  });

  // Add event listeners for navigation buttons
  app.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const page = btn.getAttribute('data-nav');
      router.navigate(`/${page}`);
    });
  });

  // Pre-compute translations for search optimization
  const categoryTranslations = new Map();
  allCategories.forEach(cat => {
    categoryTranslations.set(cat, translateCategory(cat, t).toLowerCase());
  });

  // Add search functionality
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const searchTerm = searchInput.value.toLowerCase();
      let filtered = allCategories;

      if (searchTerm) {
        filtered = filtered.filter(c => categoryTranslations.get(c).includes(searchTerm));
      }

      renderCategories(filtered);
    });
  }
}

// Render subcategory selection for a main category
async function renderGuestSubcategorySelection(mainCategory, t, app) {
  const subcategories = getSubcategories(mainCategory);
  const allProducts = await dataService.getProducts({ limit: 2000 });
  
  // Filter to only subcategories that have products
  const availableSubcategories = subcategories.filter(subcat => 
    allProducts.some(p => p.category === subcat)
  );
  
  const renderSubcategories = (subcategoriesToRender) => {
    const categoriesGrid = document.querySelector('.categories-grid');
    if (!categoriesGrid) return;

    if (subcategoriesToRender.length === 0) {
      categoriesGrid.innerHTML = `
        <div class="empty-state">
          <i data-lucide="folder-open" style="width: 64px; height: 64px; opacity: 0.3; margin-bottom: 16px;"></i>
          <p>${t('catalog.noSubcategories') || 'No subcategories available'}</p>
        </div>
      `;
    } else {
      categoriesGrid.innerHTML = subcategoriesToRender.map(subcategory => `
        <div class="category-tile card" data-subcategory="${escapeHtml(subcategory)}" style="cursor: pointer;">
          <div class="category-icon" style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <i data-lucide="layers" style="width: 40px; height: 40px; color: white;"></i>
          </div>
          <h3 style="text-align: center; margin-bottom: 8px; font-size: 18px;">${escapeHtml(translateCategory(subcategory, t))}</h3>
          <p style="text-align: center; color: var(--text-secondary); font-size: 14px;">${t('catalog.browseProducts') || 'Browse products'}</p>
        </div>
      `).join('');
    }

    // Add event listeners
    document.querySelectorAll('.category-tile[data-subcategory]').forEach(tile => {
      tile.addEventListener('click', () => {
        const subcategory = tile.getAttribute('data-subcategory');
        router.navigate(`/guest/catalog?category=${encodeURIComponent(subcategory)}`);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  };

  app.innerHTML = `
    <div class="guest-catalog-page" style="min-height: 100vh; background: var(--background-primary);">
      <!-- Simple Header -->
      <div class="public-header">
        <div class="header-container">
          <button class="back-btn" id="back-to-catalog">
            <i data-lucide="arrow-left"></i> Back to Categories
          </button>
          <div class="header-actions">
            <button class="btn btn-secondary" data-nav="login">Login</button>
            <button class="btn btn-primary" data-nav="signup">Sign Up</button>
          </div>
        </div>
      </div>
      
      <div class="catalog-page" style="padding: 48px 24px; max-width: 1400px; margin: 0 auto;">
        <div class="page-header" style="margin-bottom: 48px;">
          <div>
            <h1>${escapeHtml(translateCategory(mainCategory, t))}</h1>
            <p>${t('catalog.selectSubcategory') || 'Select a subcategory to browse products'}</p>
          </div>
        </div>

        <div class="catalog-controls" style="margin-bottom: 24px;">
          <input type="text" id="search-input" placeholder="${t('common.search')}..." class="form-control">
        </div>

        <div class="categories-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 24px;">
          <!-- Subcategories will be rendered here -->
        </div>
      </div>
    </div>
  `;

  renderSubcategories(availableSubcategories);

  // Add event listener for back button
  document.getElementById('back-to-catalog')?.addEventListener('click', () => {
    router.navigate('/guest/catalog');
  });

  // Add event listeners for navigation buttons
  app.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const page = btn.getAttribute('data-nav');
      router.navigate(`/${page}`);
    });
  });

  // Pre-compute translations for search optimization
  const subcategoryTranslations = new Map();
  availableSubcategories.forEach(subcat => {
    subcategoryTranslations.set(subcat, translateCategory(subcat, t).toLowerCase());
  });

  // Add search functionality
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const searchTerm = searchInput.value.toLowerCase();
      let filtered = availableSubcategories;

      if (searchTerm) {
        filtered = filtered.filter(s => subcategoryTranslations.get(s).includes(searchTerm));
      }

      renderSubcategories(filtered);
    });
  }
}

// Render products for a specific category (without seller selection)
async function renderGuestProducts(category, t, app) {
  const allProducts = await dataService.getProducts({ limit: 2000 });
  
  // Filter products by category
  const categoryProducts = allProducts.filter(p => p.category === category);
  
  const renderProducts = (productsToRender) => {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;

    if (productsToRender.length === 0) {
      productsGrid.innerHTML = `
        <div class="empty-state">
          <i data-lucide="package-open" style="width: 64px; height: 64px; opacity: 0.3; margin-bottom: 16px;"></i>
          <p>${t('catalog.noProducts')}</p>
        </div>
      `;
    } else {
      productsGrid.innerHTML = productsToRender.map(product => `
        <div class="product-card card" data-product-id="${product.id}" style="cursor: pointer;">
          ${product.imageUrl ? `
            <img src="${product.imageUrl}" 
                 alt="${escapeHtml(product.modelNumber || product.name || 'Product')}" 
                 loading="lazy"
                 onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';"
                 style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0; margin: -16px -16px 16px -16px;" />
            <div style="width: calc(100% + 32px); height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0; margin: -16px -16px 16px -16px; display: none; align-items: center; justify-content: center; flex-direction: column; color: white;">
              <i data-lucide="image-off" style="width: 48px; height: 48px; opacity: 0.8; margin-bottom: 8px;"></i>
              <span style="font-size: 12px; opacity: 0.8;">Image not available</span>
            </div>
          ` : `
            <div style="width: calc(100% + 32px); height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0; margin: -16px -16px 16px -16px; display: flex; align-items: center; justify-content: center; flex-direction: column; color: white;">
              <i data-lucide="package" style="width: 48px; height: 48px; opacity: 0.8; margin-bottom: 8px;"></i>
              <span style="font-size: 12px; opacity: 0.8;">No image</span>
            </div>
          `}
          <div class="product-header">
            <h3>${escapeHtml(product.modelNumber || product.name || 'Product')}</h3>
            <span class="product-category">${escapeHtml(product.category || 'Uncategorized')}</span>
          </div>
          <div class="product-body">
            <p>${escapeHtml(product.description || 'No description available')}</p>
            <div class="product-info">
              <div class="info-item">
                <span class="label">${t('catalog.price')}</span>
                <span class="value">$${product.pricePerMeter || product.price || 0}/${escapeHtml(product.unit || 'unit')}</span>
              </div>
              <div class="info-item">
                <span class="label">${t('catalog.minOrder')}</span>
                <span class="value">${product.minOrder || 1} ${escapeHtml(product.unit || 'unit')}</span>
              </div>
              <div class="info-item">
                <span class="label">${t('catalog.stock')}</span>
                <span class="value">${product.stock || 'Available'}</span>
              </div>
            </div>
          </div>
          <div class="product-footer">
            <span class="view-details-text">
              <i data-lucide="eye"></i>
              ${t('catalog.viewDetails')}
            </span>
          </div>
        </div>
      `).join('');
    }

    // Re-attach event listeners for product cards
    document.querySelectorAll('.product-card[data-product-id]').forEach(card => {
      card.addEventListener('click', () => {
        const productId = card.dataset.productId;
        // Navigate to guest product detail
        router.navigate(`/guest/product?id=${productId}`);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  };
  
  app.innerHTML = `
    <div class="guest-catalog-page" style="min-height: 100vh; background: var(--background-primary);">
      <!-- Simple Header -->
      <div class="public-header">
        <div class="header-container">
          <button class="back-btn" id="back-to-subcategories">
            <i data-lucide="arrow-left"></i> Back
          </button>
          <div class="header-actions">
            <button class="btn btn-secondary" data-nav="login">Login</button>
            <button class="btn btn-primary" data-nav="signup">Sign Up</button>
          </div>
        </div>
      </div>
      
      <div class="catalog-page" style="padding: 48px 24px; max-width: 1400px; margin: 0 auto;">
        <div class="page-header">
          <div>
            <h1>${escapeHtml(translateCategory(category, t))}</h1>
            <p>${t('catalog.subtitle')}</p>
          </div>
        </div>

        <div class="catalog-controls" style="margin-bottom: 24px;">
          <input type="text" id="search-input" placeholder="${t('common.search')}..." class="form-control">
        </div>

        <div class="products-grid">
          <!-- Products will be rendered here -->
        </div>
        
        <div style="text-align: center; margin-top: 48px; padding: 24px; background: var(--background-secondary); border-radius: 8px;">
          <p style="margin-bottom: 12px; font-size: 16px; font-weight: 500;">Want to order these products?</p>
          <p style="margin-bottom: 16px;">Sign in or create an account to add products to cart and place orders</p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button class="btn btn-secondary" data-nav="login">Login</button>
            <button class="btn btn-primary" data-nav="signup">Sign Up</button>
          </div>
        </div>
      </div>
    </div>
  `;

  renderProducts(categoryProducts);

  // Add event listener for back button
  document.getElementById('back-to-subcategories')?.addEventListener('click', () => {
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

  // Add search functionality
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const searchTerm = searchInput.value.toLowerCase();
      let filtered = categoryProducts;

      if (searchTerm) {
        filtered = filtered.filter(p => {
          const name = (p.modelNumber || p.name || '').toLowerCase();
          const description = (p.description || '').toLowerCase();
          return name.includes(searchTerm) || description.includes(searchTerm);
        });
      }

      renderProducts(filtered);
    });
  }
}
