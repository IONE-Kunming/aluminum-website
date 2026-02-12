import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import authManager from '../js/auth.js';
import { escapeHtml } from '../js/utils.js';
import languageManager from '../js/language.js';
import dataService from '../js/dataService.js';
import { 
  isMainCategory, 
  isSubcategory, 
  getSubcategories,
  getMainCategories,
  getMainCategoryForSubcategory
} from '../js/categoryHierarchy.js';

// Helper function to get seller ID consistently
function getSellerId(seller) {
  return seller.uid || seller.id;
}

// Helper function to translate category names
function translateCategory(category, t) {
  if (!category) return '';
  // Try to get translation from categoryNames, fallback to original if not found
  const translationKey = `categoryNames.${category}`;
  const translated = t(translationKey);
  // If translation not found, t() returns the key itself, so check if it matches the key
  return translated === translationKey ? category : translated;
}

export async function renderCatalog() {
  const profile = authManager.getUserProfile();
  const t = languageManager.t.bind(languageManager);
  const urlParams = new URLSearchParams(window.location.search);
  const sellerId = urlParams.get('seller');
  const category = urlParams.get('category');
  const mainCategory = urlParams.get('mainCategory');
  const subcategory = urlParams.get('subcategory');
  
  // If sellerId is provided, show products for that seller
  // Priority: subcategory param (for filtered view) > category param (for backward compatibility)
  if (sellerId) {
    const filterCategory = subcategory || category; // Prefer subcategory for filtered seller views
    await renderSellerProducts(sellerId, filterCategory, t);
    return;
  }
  
  // If category is provided, check if it's main or sub
  if (category) {
    if (isMainCategory(category)) {
      // Show subcategories for this main category
      await renderSubcategorySelection(category, t);
    } else if (isSubcategory(category)) {
      // Show sellers for this subcategory
      await renderSellersForCategory(category, t);
    } else {
      // Treat as a regular category (backward compatibility)
      await renderSellersForCategory(category, t);
    }
    return;
  }
  
  // If mainCategory is provided (for direct subcategory navigation)
  if (mainCategory) {
    await renderSubcategorySelection(mainCategory, t);
    return;
  }
  
  // Otherwise, show main category tiles
  await renderMainCategoryTiles(t);
}

// Render products for a specific seller
async function renderSellerProducts(sellerId, filterCategory, t) {
  const products = await dataService.getProducts({ sellerId });
  const sellers = await dataService.getSellers();
  const seller = sellers.find(s => s.id === sellerId || s.uid === sellerId);
  
  // Filter products by category if provided
  const filteredProducts = filterCategory 
    ? products.filter(p => p.category === filterCategory)
    : products;
  
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
        const productId = card.getAttribute('data-product-id');
        router.navigate(`/buyer/product?id=${productId}`);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  };
  
  // Determine subtitle based on filter
  const subtitle = filterCategory 
    ? `${t('products.category')}: ${escapeHtml(translateCategory(filterCategory, t))}`
    : t('catalog.subtitle');
  
  const content = `
    <div class="catalog-page">
      <div class="page-header">
        <div>
          <h1>${t('catalog.productsFrom')} ${escapeHtml(seller?.displayName || seller?.companyName || 'Seller')}</h1>
          <p>${subtitle}</p>
        </div>
        <button class="btn btn-secondary" onclick="window.history.back()">
          <i data-lucide="arrow-left"></i>
          ${t('common.back')}
        </button>
      </div>

      <div class="catalog-controls" style="margin-bottom: 24px;">
        <input type="text" id="search-input" placeholder="${t('common.search')}..." class="form-control">
      </div>

      <div class="products-grid">
        <!-- Products will be rendered here -->
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  renderProducts(filteredProducts);

  // Add search functionality
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const searchTerm = searchInput.value.toLowerCase();
      let filtered = filteredProducts;

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

// Render main category tiles - first view of product catalogue
async function renderMainCategoryTiles(t) {
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
            ${isMainCategory(category) ? t('catalog.viewSubcategories') || 'View subcategories' : t('catalog.clickToViewSellers')}
          </p>
        </div>
      `).join('');
    }

    // Add event listeners
    document.querySelectorAll('.category-tile[data-category]').forEach(tile => {
      tile.addEventListener('click', () => {
        const category = tile.getAttribute('data-category');
        // Navigation logic in renderCatalog will determine if it's main or unmapped
        router.navigate(`/buyer/catalog?category=${encodeURIComponent(category)}`);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  };

  const content = `
    <div class="catalog-page">
      <div class="page-header">
        <h1>${t('catalog.title')}</h1>
        <p>${t('catalog.selectCategory')}</p>
      </div>

      <div class="catalog-controls" style="margin-bottom: 24px;">
        <input type="text" id="search-input" placeholder="${t('common.search')} ${t('catalog.categories').toLowerCase()}..." class="form-control">
      </div>

      <div class="categories-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 24px;">
        <!-- Categories will be rendered here -->
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  renderCategories(allCategories);

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
async function renderSubcategorySelection(mainCategory, t) {
  const subcategories = getSubcategories(mainCategory);
  const allProducts = await dataService.getProducts();
  
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
          <p style="text-align: center; color: var(--text-secondary); font-size: 14px;">${t('catalog.clickToViewSellers')}</p>
        </div>
      `).join('');
    }

    // Add event listeners
    document.querySelectorAll('.category-tile[data-subcategory]').forEach(tile => {
      tile.addEventListener('click', () => {
        const subcategory = tile.getAttribute('data-subcategory');
        router.navigate(`/buyer/catalog?category=${encodeURIComponent(subcategory)}`);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  };

  const content = `
    <div class="catalog-page">
      <div class="page-header">
        <div>
          <h1>${escapeHtml(translateCategory(mainCategory, t))}</h1>
          <p>${t('catalog.selectSubcategory') || 'Select a subcategory to browse products'}</p>
        </div>
        <button class="btn btn-secondary" onclick="window.history.back()">
          <i data-lucide="arrow-left"></i>
          ${t('common.back')}
        </button>
      </div>

      <div class="catalog-controls" style="margin-bottom: 24px;">
        <input type="text" id="search-input" placeholder="${t('common.search')} ${t('catalog.subcategories') || 'subcategories'}..." class="form-control">
      </div>

      <div class="categories-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 24px;">
        <!-- Subcategories will be rendered here -->
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  renderSubcategories(availableSubcategories);

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
        filtered = filtered.filter(c => subcategoryTranslations.get(c).includes(searchTerm));
      }

      renderSubcategories(filtered);
    });
  }
}

// Render sellers for a specific category
async function renderSellersForCategory(category, t) {
  const allProducts = await dataService.getProducts();
  const allSellers = await dataService.getSellers();
  
  // Determine if current category is a main category or subcategory
  const isMainCat = isMainCategory(category);
  const isSubCat = isSubcategory(category);
  
  // Get the main category (if current is subcategory, find its parent; otherwise use current)
  const mainCategory = isSubCat ? getMainCategoryForSubcategory(category) : (isMainCat ? category : 'Construction');
  
  // Get all main categories for the dropdown
  const mainCategories = getMainCategories();
  
  // Get subcategories for the main category
  const subcategoriesForMain = mainCategory ? getSubcategories(mainCategory) : [];
  
  // Filter products by category
  const categoryProducts = allProducts.filter(p => p.category === category);
  
  // Get unique seller IDs from filtered products
  const sellerIds = new Set(categoryProducts.map(p => p.sellerId).filter(Boolean));
  
  // Filter sellers who have products in this category
  const sellersInCategory = allSellers.filter(seller => 
    sellerIds.has(seller.uid) || sellerIds.has(seller.id)
  );
  
  // Group products by seller and category for display
  const sellerProductMap = new Map();
  const sellerCategoryMap = new Map();
  
  categoryProducts.forEach(product => {
    if (!product.sellerId) return;
    
    if (!sellerProductMap.has(product.sellerId)) {
      sellerProductMap.set(product.sellerId, []);
    }
    sellerProductMap.set(product.sellerId, [...sellerProductMap.get(product.sellerId), product]);
    
    if (product.category) {
      if (!sellerCategoryMap.has(product.sellerId)) {
        sellerCategoryMap.set(product.sellerId, new Set());
      }
      sellerCategoryMap.get(product.sellerId).add(product.category);
    }
  });
  
  const renderSellers = (sellersToRender) => {
    const sellersGrid = document.querySelector('.sellers-grid');
    if (!sellersGrid) return;

    if (sellersToRender.length === 0) {
      sellersGrid.innerHTML = `
        <div class="empty-state">
          <i data-lucide="store" style="width: 64px; height: 64px; opacity: 0.3; margin-bottom: 16px;"></i>
          <p>${t('catalog.noSellersInCategory')}</p>
        </div>
      `;
    } else {
      sellersGrid.innerHTML = sellersToRender.map(seller => {
        const sellerId = getSellerId(seller);
        const productCount = sellerProductMap.get(sellerId)?.length || 0;
        const sellerCategories = Array.from(sellerCategoryMap.get(sellerId) || []);
        const city = seller.address?.city || seller.city || 'N/A';
        
        return `
          <div class="seller-tile card">
            <div class="seller-tile-header">
              <div class="seller-avatar">
                <i data-lucide="store"></i>
              </div>
              <div class="seller-tile-info">
                <h3>${escapeHtml(seller.displayName || seller.email || 'Seller')}</h3>
                ${seller.companyName ? `<p class="seller-company">${escapeHtml(seller.companyName)}</p>` : ''}
              </div>
            </div>
            <div class="seller-tile-body">
              <div class="seller-detail">
                <i data-lucide="map-pin"></i>
                <span><strong>${t('catalog.city')}:</strong> ${escapeHtml(city)}</span>
              </div>
              <div class="seller-detail">
                <i data-lucide="package"></i>
                <span><strong>${t('products.title')}:</strong> ${productCount}</span>
              </div>
              ${sellerCategories.length > 0 ? `
                <div class="seller-detail">
                  <i data-lucide="tag"></i>
                  <span><strong>${t('products.category')}:</strong> ${sellerCategories.slice(0, 2).map(c => escapeHtml(c)).join(', ')}${sellerCategories.length > 2 ? '...' : ''}</span>
                </div>
              ` : ''}
            </div>
            <div class="seller-tile-actions">
              <button class="btn btn-text btn-sm view-seller-info-btn" data-seller-id="${sellerId}">
                <i data-lucide="info"></i>
                ${t('sellers.viewInfo')}
              </button>
              <button class="btn btn-primary btn-sm view-products-btn" data-seller-id="${sellerId}">
                <i data-lucide="package"></i>
                ${t('catalog.viewProducts')}
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Add event listeners
    document.querySelectorAll('.view-products-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sellerId = btn.dataset.sellerId;
        router.navigate(`/buyer/catalog?seller=${sellerId}&subcategory=${encodeURIComponent(category)}`);
      });
    });
    
    document.querySelectorAll('.view-seller-info-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sellerId = btn.dataset.sellerId;
        const seller = sellersInCategory.find(s => getSellerId(s) === sellerId);
        if (seller) {
          showSellerInfoModal(seller, t);
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  };

  const content = `
    <div class="catalog-page">
      <div class="page-header">
        <div>
          <h1>${t('catalog.sellersInCategory')}: ${escapeHtml(translateCategory(category, t))}</h1>
          <p>${t('catalog.sellerDirectory')}</p>
        </div>
        <button class="btn btn-secondary" onclick="window.history.back()">
          <i data-lucide="arrow-left"></i>
          ${t('common.back')}
        </button>
      </div>

      <div class="catalog-controls three-column">
        <input type="text" id="search-input" placeholder="${t('common.search')} ${t('sellers.title').toLowerCase()}..." class="form-control">
        <select id="main-category-filter" class="form-control" style="max-width: 200px;">
          <option value="">${t('catalog.allMainCategories')}</option>
          ${mainCategories.map(cat => `<option value="${escapeHtml(cat)}" ${cat === mainCategory ? 'selected' : ''}>${escapeHtml(translateCategory(cat, t))}</option>`).join('')}
        </select>
        <select id="sub-category-filter" class="form-control" style="max-width: 200px;">
          <option value="">${t('catalog.allSubCategories')}</option>
          ${subcategoriesForMain.filter(subCat => {
            // Only show subcategories that have products
            return allProducts.some(p => p.category === subCat);
          }).map(subCat => `<option value="${escapeHtml(subCat)}" ${subCat === category ? 'selected' : ''}>${escapeHtml(translateCategory(subCat, t))}</option>`).join('')}
        </select>
      </div>

      <div class="sellers-grid">
        <!-- Sellers will be rendered here -->
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  renderSellers(sellersInCategory);

  // Add search and filter functionality
  const searchInput = document.getElementById('search-input');
  const mainCategoryFilter = document.getElementById('main-category-filter');
  const subCategoryFilter = document.getElementById('sub-category-filter');

  const applyFilters = () => {
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const selectedMainCategory = mainCategoryFilter?.value || '';
    const selectedSubCategory = subCategoryFilter?.value || '';

    // If a different main category is selected, navigate to that category
    if (selectedMainCategory && selectedMainCategory !== mainCategory) {
      router.navigate(`/buyer/catalog?category=${encodeURIComponent(selectedMainCategory)}`);
      return;
    }

    // If a different subcategory is selected, navigate to that subcategory
    if (selectedSubCategory && selectedSubCategory !== category) {
      router.navigate(`/buyer/catalog?category=${encodeURIComponent(selectedSubCategory)}`);
      return;
    }

    // Filter sellers by search term
    let filtered = sellersInCategory;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(seller => {
        const name = (seller.displayName || '').toLowerCase();
        const company = (seller.companyName || '').toLowerCase();
        const email = (seller.email || '').toLowerCase();
        return name.includes(searchTerm) || company.includes(searchTerm) || email.includes(searchTerm);
      });
    }

    renderSellers(filtered);
  };

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (mainCategoryFilter) {
    mainCategoryFilter.addEventListener('change', applyFilters);
  }

  if (subCategoryFilter) {
    subCategoryFilter.addEventListener('change', applyFilters);
  }
}

// Render seller tiles
async function renderSellerTiles(t) {
  const allProducts = await dataService.getProducts();
  const allSellers = await dataService.getSellers();
  const categories = await dataService.getCategories();
  
  // Group products by seller and category
  const sellerProductMap = new Map();
  const sellerCategoryMap = new Map();
  
  allProducts.forEach(product => {
    if (!product.sellerId) return;
    
    if (!sellerProductMap.has(product.sellerId)) {
      sellerProductMap.set(product.sellerId, []);
    }
    sellerProductMap.set(product.sellerId, [...sellerProductMap.get(product.sellerId), product]);
    
    if (product.category) {
      if (!sellerCategoryMap.has(product.sellerId)) {
        sellerCategoryMap.set(product.sellerId, new Set());
      }
      sellerCategoryMap.get(product.sellerId).add(product.category);
    }
  });
  
  // Filter sellers who have products
  const sellersWithProducts = allSellers.filter(seller => 
    sellerProductMap.has(seller.uid) || sellerProductMap.has(seller.id)
  );
  
  const renderSellers = (sellersToRender) => {
    const sellersGrid = document.querySelector('.sellers-grid');
    if (!sellersGrid) return;

    if (sellersToRender.length === 0) {
      sellersGrid.innerHTML = `
        <div class="empty-state">
          <i data-lucide="store" style="width: 64px; height: 64px; opacity: 0.3; margin-bottom: 16px;"></i>
          <p>${t('catalog.noSellers')}</p>
        </div>
      `;
    } else {
      sellersGrid.innerHTML = sellersToRender.map(seller => {
        const sellerId = getSellerId(seller);
        const productCount = sellerProductMap.get(sellerId)?.length || 0;
        const sellerCategories = Array.from(sellerCategoryMap.get(sellerId) || []);
        const city = seller.address?.city || seller.city || 'N/A';
        
        return `
          <div class="seller-tile card">
            <div class="seller-tile-header">
              <div class="seller-avatar">
                <i data-lucide="store"></i>
              </div>
              <div class="seller-tile-info">
                <h3>${escapeHtml(seller.displayName || seller.email || 'Seller')}</h3>
                ${seller.companyName ? `<p class="seller-company">${escapeHtml(seller.companyName)}</p>` : ''}
              </div>
            </div>
            <div class="seller-tile-body">
              <div class="seller-detail">
                <i data-lucide="map-pin"></i>
                <span><strong>${t('catalog.city')}:</strong> ${escapeHtml(city)}</span>
              </div>
              <div class="seller-detail">
                <i data-lucide="package"></i>
                <span><strong>${t('products.title')}:</strong> ${productCount}</span>
              </div>
              ${sellerCategories.length > 0 ? `
                <div class="seller-detail">
                  <i data-lucide="tag"></i>
                  <span><strong>${t('products.category')}:</strong> ${sellerCategories.slice(0, 2).map(c => escapeHtml(c)).join(', ')}${sellerCategories.length > 2 ? '...' : ''}</span>
                </div>
              ` : ''}
            </div>
            <div class="seller-tile-actions">
              <button class="btn btn-text btn-sm view-seller-info-btn" data-seller-id="${sellerId}">
                <i data-lucide="info"></i>
                ${t('sellers.viewInfo')}
              </button>
              <button class="btn btn-primary btn-sm view-products-btn" data-seller-id="${sellerId}">
                <i data-lucide="package"></i>
                ${t('catalog.viewProducts')}
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Add event listeners
    document.querySelectorAll('.view-products-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sellerId = btn.dataset.sellerId;
        router.navigate(`/buyer/catalog?seller=${sellerId}`);
      });
    });
    
    document.querySelectorAll('.view-seller-info-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sellerId = btn.dataset.sellerId;
        const seller = sellersWithProducts.find(s => getSellerId(s) === sellerId);
        if (seller) {
          showSellerInfoModal(seller, t);
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  };

  const content = `
    <div class="catalog-page">
      <div class="page-header">
        <h1>${t('catalog.title')}</h1>
        <p>${t('catalog.sellerDirectory')}</p>
      </div>

      <div class="catalog-controls" style="margin-bottom: 24px; display: grid; grid-template-columns: 1fr auto; gap: 16px;">
        <input type="text" id="search-input" placeholder="${t('common.search')} ${t('sellers.title').toLowerCase()}..." class="form-control">
        <select id="category-filter" class="form-control" style="max-width: 250px;">
          <option value="">${t('common.allCategories')}</option>
          ${categories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(translateCategory(cat, t))}</option>`).join('')}
        </select>
      </div>

      <div class="sellers-grid">
        <!-- Sellers will be rendered here -->
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  renderSellers(sellersWithProducts);

  // Add search and filter functionality
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');

  const applyFilters = () => {
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const category = categoryFilter?.value || '';

    let filtered = sellersWithProducts;

    // Filter by category
    if (category) {
      filtered = filtered.filter(seller => {
        const sellerId = getSellerId(seller);
        const categories = sellerCategoryMap.get(sellerId);
        return categories && categories.has(category);
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(seller => {
        const name = (seller.displayName || '').toLowerCase();
        const company = (seller.companyName || '').toLowerCase();
        const email = (seller.email || '').toLowerCase();
        return name.includes(searchTerm) || company.includes(searchTerm) || email.includes(searchTerm);
      });
    }

    renderSellers(filtered);
  };

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', applyFilters);
  }
}

// Show seller info modal
function showSellerInfoModal(seller, t) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h2>${t('sellers.viewInfo')}</h2>
        <button class="btn-close-modal">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: 16px;">
          <strong>${t('profile.displayName')}:</strong>
          <p>${escapeHtml(seller.displayName || 'N/A')}</p>
        </div>
        ${seller.companyName ? `
          <div style="margin-bottom: 16px;">
            <strong>${t('sellers.company')}:</strong>
            <p>${escapeHtml(seller.companyName)}</p>
          </div>
        ` : ''}
        <div style="margin-bottom: 16px;">
          <strong>${t('profile.email')}:</strong>
          <p>${escapeHtml(seller.email || 'N/A')}</p>
        </div>
        ${seller.phoneNumber ? `
          <div style="margin-bottom: 16px;">
            <strong>${t('auth.phoneNumber')}:</strong>
            <p>${escapeHtml(seller.phoneNumber)}</p>
          </div>
        ` : ''}
        ${seller.address?.city ? `
          <div style="margin-bottom: 16px;">
            <strong>${t('catalog.city')}:</strong>
            <p>${escapeHtml(seller.address.city)}</p>
          </div>
        ` : ''}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-close-modal">${t('common.close')}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();
  
  // Close modal handlers
  modal.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.remove();
    });
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

