import { renderPageWithLayout } from '../js/layout.js';
import router from '../js/router.js';
import authManager from '../js/auth.js';
import { escapeHtml } from '../js/utils.js';
import languageManager from '../js/language.js';
import dataService from '../js/dataService.js';

// Helper function to translate category names
function translateCategory(category, t) {
  if (!category) return '';
  const translationKey = `categoryNames.${category}`;
  const translated = t(translationKey);
  return translated === translationKey ? category : translated;
}

export async function renderAllProducts() {
  const t = languageManager.t.bind(languageManager);
  const user = authManager.getCurrentUser();
  
  if (!user) {
    router.navigate('/login');
    return;
  }
  
  // Fetch all products from all sellers and category hierarchy
  const [products, hierarchyData] = await Promise.all([
    dataService.getProducts({ limit: 500 }),
    dataService.getCategoriesHierarchy()
  ]);
  
  const { mainCategories, unmappedCategories } = hierarchyData;
  
  const PAGE_SIZE = 12;
  let currentPage = 1;

  const renderProducts = (productsToRender, page = 1) => {
    currentPage = page;
    const productsGrid = document.querySelector('.products-grid');
    const paginationContainer = document.querySelector('.products-pagination');
    if (!productsGrid) return;

    const totalPages = Math.max(1, Math.ceil(productsToRender.length / PAGE_SIZE));
    if (page > totalPages) page = totalPages;
    const start = (page - 1) * PAGE_SIZE;
    const pageProducts = productsToRender.slice(start, start + PAGE_SIZE);

    if (productsToRender.length === 0) {
      productsGrid.innerHTML = `
        <div class="empty-state">
          <i data-lucide="package-open" style="width: 64px; height: 64px; opacity: 0.3; margin-bottom: 16px;"></i>
          <p>${t('catalog.noProducts')}</p>
        </div>
      `;
      if (paginationContainer) paginationContainer.innerHTML = '';
    } else {
      productsGrid.innerHTML = pageProducts.map(product => `
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
            <p class="product-seller" style="color: var(--text-secondary); font-size: 14px; margin-bottom: 8px;">
              <i data-lucide="store" style="width: 14px; height: 14px;"></i>
              ${escapeHtml(product.sellerName || product.seller || 'Unknown Seller')}
            </p>
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

      // Render pagination controls
      if (paginationContainer && totalPages > 1) {
        let numberedButtons = '';
        const windowSize = 5;
        let startPage = Math.max(1, page - Math.floor(windowSize / 2));
        let endPage = Math.min(totalPages, startPage + windowSize - 1);
        if (endPage - startPage < windowSize - 1) {
          startPage = Math.max(1, endPage - windowSize + 1);
        }
        for (let i = startPage; i <= endPage; i++) {
          const btnClass = i === page ? 'btn-primary' : 'btn-secondary';
          numberedButtons += `<button class="btn ${btnClass} btn-sm product-page-btn" data-page="${i}">${i}</button>`;
        }

        paginationContainer.innerHTML = `
          <div class="pagination-controls" style="display: flex; gap: 8px; justify-content: center; align-items: center; margin-top: 24px;">
            <button class="btn btn-secondary btn-sm product-page-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>&#8249; Previous</button>
            ${numberedButtons}
            <button class="btn btn-secondary btn-sm product-page-btn" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>Next &#8250;</button>
          </div>
          <div class="pagination-info" style="text-align: center; margin-top: 8px; color: var(--text-secondary); font-size: 14px;">Page ${page} of ${totalPages}</div>
        `;

        // Attach pagination click handlers
        paginationContainer.querySelectorAll('.product-page-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const targetPage = parseInt(btn.getAttribute('data-page'), 10);
            if (targetPage >= 1 && targetPage <= totalPages) {
              renderProducts(productsToRender, targetPage);
              const productsSection = document.getElementById('products-section');
              if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth' });
            }
          });
        });
      } else if (paginationContainer) {
        paginationContainer.innerHTML = '';
      }
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
  
  const content = `
    <div class="all-products-page">
      <div class="page-header">
        <div>
          <h1>${t('allProducts.title') || 'All Products'}</h1>
          <p>${t('allProducts.subtitle') || 'Browse products from all sellers'}</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="tabs-container" style="margin-bottom: 32px; border-bottom: 2px solid var(--border-color);">
        <div class="tabs" style="display: flex; gap: 24px;">
          <button class="tab-btn active" data-tab="categories" style="padding: 12px 24px; border: none; background: none; cursor: pointer; font-size: 16px; font-weight: 600; border-bottom: 3px solid var(--primary-color); color: var(--primary-color);">
            ${t('catalog.categories') || 'Categories'}
          </button>
          <button class="tab-btn" data-tab="products" style="padding: 12px 24px; border: none; background: none; cursor: pointer; font-size: 16px; font-weight: 600; border-bottom: 3px solid transparent; color: var(--text-secondary);">
            ${t('allProducts.title') || 'All Products'}
          </button>
        </div>
      </div>

      <!-- Categories & Subcategories Section -->
      <div id="categories-section" class="tab-content">
        <h2 style="margin-bottom: 24px;">${t('catalog.allMainCategories') || 'Main Categories'}</h2>
        <div class="categories-grid" id="main-categories-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 24px; margin-bottom: 48px;">
          <!-- Main categories will be rendered here -->
        </div>

        <h2 style="margin-bottom: 24px;">${t('catalog.allSubCategories') || 'Sub Categories'}</h2>
        <div class="categories-grid" id="subcategories-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
          <!-- Subcategories will be rendered here -->
        </div>
      </div>

      <!-- Products Section -->
      <div id="products-section" class="tab-content" style="display: none;">
        <div class="catalog-controls" style="margin-bottom: 24px; display: flex; gap: 16px; flex-wrap: wrap;">
          <input type="text" id="search-input" placeholder="${t('common.search')}..." class="form-control" style="flex: 1; min-width: 250px;">
          
          <select id="category-filter" class="form-control" style="width: 200px;">
            <option value="">${t('allProducts.allCategories') || 'All Categories'}</option>
          </select>
          
          <select id="sort-filter" class="form-control" style="width: 200px;">
            <option value="newest">${t('allProducts.sortNewest') || 'Newest First'}</option>
            <option value="price-low">${t('allProducts.sortPriceLow') || 'Price: Low to High'}</option>
            <option value="price-high">${t('allProducts.sortPriceHigh') || 'Price: High to Low'}</option>
            <option value="name">${t('allProducts.sortName') || 'Name A-Z'}</option>
          </select>
        </div>

        <div class="products-grid">
          <!-- Products will be rendered here -->
        </div>
        <div class="products-pagination"></div>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'buyer');
  
  // Render main categories
  const mainCategoriesGrid = document.getElementById('main-categories-grid');
  if (mainCategoriesGrid && mainCategories.length > 0) {
    mainCategoriesGrid.innerHTML = mainCategories.map(category => `
      <div class="category-tile card" data-category="${escapeHtml(category)}" style="cursor: pointer; text-align: center; padding: 24px;">
        <div class="category-icon" style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          <i data-lucide="box" style="width: 40px; height: 40px; color: white;"></i>
        </div>
        <h3 style="margin-bottom: 8px; font-size: 18px;">${escapeHtml(translateCategory(category, t))}</h3>
        <p style="color: var(--text-secondary); font-size: 14px;">
          ${t('catalog.viewSubcategories') || 'View subcategories'}
        </p>
      </div>
    `).join('');
    
    // Add click handlers for main categories
    document.querySelectorAll('#main-categories-grid .category-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const category = tile.getAttribute('data-category');
        router.navigate(`/buyer/catalog?category=${encodeURIComponent(category)}`);
      });
    });
  }
  
  // Collect all subcategories
  const allSubcategories = [];
  mainCategories.forEach(mainCat => {
    const subs = getSubcategories(mainCat);
    subs.forEach(sub => {
      allSubcategories.push({ subcategory: sub, mainCategory: mainCat });
    });
  });
  
  // Render subcategories
  const subcategoriesGrid = document.getElementById('subcategories-grid');
  if (subcategoriesGrid && allSubcategories.length > 0) {
    subcategoriesGrid.innerHTML = allSubcategories.map(({ subcategory, mainCategory }) => `
      <div class="subcategory-tile card" data-subcategory="${escapeHtml(subcategory)}" style="cursor: pointer; text-align: center; padding: 16px;">
        <div class="subcategory-icon" style="width: 48px; height: 48px; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
          <i data-lucide="tag" style="width: 24px; height: 24px; color: #667eea;"></i>
        </div>
        <h4 style="margin-bottom: 4px; font-size: 14px;">${escapeHtml(translateCategory(subcategory, t))}</h4>
        <p style="color: var(--text-secondary); font-size: 12px;">
          ${escapeHtml(translateCategory(mainCategory, t))}
        </p>
      </div>
    `).join('');
    
    // Add click handlers for subcategories
    document.querySelectorAll('#subcategories-grid .subcategory-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const subcategory = tile.getAttribute('data-subcategory');
        router.navigate(`/buyer/catalog?category=${encodeURIComponent(subcategory)}`);
      });
    });
  }
  
  // Tab switching functionality
  const tabButtons = document.querySelectorAll('.tab-btn');
  const categoriesSection = document.getElementById('categories-section');
  const productsSection = document.getElementById('products-section');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      // Update active tab
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.style.borderBottom = '3px solid transparent';
        b.style.color = 'var(--text-secondary)';
      });
      btn.classList.add('active');
      btn.style.borderBottom = '3px solid var(--primary-color)';
      btn.style.color = 'var(--primary-color)';
      
      // Show/hide sections
      if (targetTab === 'categories') {
        categoriesSection.style.display = 'block';
        productsSection.style.display = 'none';
      } else {
        categoriesSection.style.display = 'none';
        productsSection.style.display = 'block';
      }
      
      if (window.lucide) window.lucide.createIcons();
    });
  });
  
  // Populate category filter with unique categories
  const uniqueCategories = [...new Set(products.map(p => p.category).filter(c => c))];
  const categoryFilter = document.getElementById('category-filter');
  if (categoryFilter) {
    uniqueCategories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });
  }
  
  // Initial render of products
  let filteredProducts = [...products];
  renderProducts(filteredProducts, 1);
  
  // Filter and sort functionality
  const applyFilters = () => {
    const searchInput = document.getElementById('search-input');
    const categoryFilterEl = document.getElementById('category-filter');
    const sortFilterEl = document.getElementById('sort-filter');
    
    const searchTerm = searchInput?.value?.toLowerCase() || '';
    const selectedCategory = categoryFilterEl?.value || '';
    const sortOption = sortFilterEl?.value || 'newest';
    
    // Filter
    let filtered = [...products];
    
    if (searchTerm) {
      filtered = filtered.filter(p => {
        const name = (p.modelNumber || p.name || '').toLowerCase();
        const description = (p.description || '').toLowerCase();
        const seller = (p.sellerName || p.seller || '').toLowerCase();
        return name.includes(searchTerm) || description.includes(searchTerm) || seller.includes(searchTerm);
      });
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'price-low':
          return (a.price || a.pricePerMeter || 0) - (b.price || b.pricePerMeter || 0);
        case 'price-high':
          return (b.price || b.pricePerMeter || 0) - (a.price || a.pricePerMeter || 0);
        case 'name':
          return (a.modelNumber || a.name || '').localeCompare(b.modelNumber || b.name || '');
        case 'newest':
        default:
          // Newest first (if createdAt exists)
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
      }
    });
    
    currentPage = 1;
    renderProducts(filtered, 1);
  };
  
  // Add event listeners
  const searchInput = document.getElementById('search-input');
  const categoryFilterEl = document.getElementById('category-filter');
  const sortFilterEl = document.getElementById('sort-filter');
  
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }
  
  if (categoryFilterEl) {
    categoryFilterEl.addEventListener('change', applyFilters);
  }
  
  if (sortFilterEl) {
    sortFilterEl.addEventListener('change', applyFilters);
  }
  
  // Initialize lucide icons
  if (window.lucide) window.lucide.createIcons();
}
