import router from '../js/router.js';
import authManager from '../js/auth.js';
import dataService from '../js/dataService.js';
import languageManager from '../js/language.js';
import { escapeHtml } from '../js/utils.js';

// All available categories
const CATEGORIES = [
  'apparelAccessories',
  'automobilesMotorcycles',
  'businessServices',
  'chemicals',
  'computerProductsElectronics',
  'constructionRealEstate',
  'consumerElectronics',
  'electricalEquipmentSupplies',
  'electronicsComponentsSupplies',
  'energy',
  'environment',
  'foodBeverage',
  'furniture',
  'giftsSportsToys',
  'hardware',
  'healthBeauty',
  'homeGarden',
  'homeAppliances',
  'industryLaserEquipment',
  'lightsLighting',
  'luggageBagsCases',
  'machinery',
  'measurementAnalysisInstruments',
  'metallurgyMineralEnergy',
  'packagingPrinting',
  'securityProtection',
  'shoesAccessories',
  'textilesLeatherProducts',
  'transportation'
];

export async function renderPublicCategories() {
  const t = languageManager.t.bind(languageManager);
  const app = document.getElementById('app');
  
  // Get available categories (only those with active products)
  const allProducts = await dataService.getProducts({ limit: 2000 });
  // Filter to show only active products
  const activeProducts = allProducts.filter(p => p.isActive !== false);
  const availableCategories = new Set();
  
  activeProducts.forEach(product => {
    if (product.category) {
      availableCategories.add(product.category);
    }
  });
  
  // Filter categories to show only those with products
  const categoriesToShow = CATEGORIES.filter(cat => {
    const translationKey = `categories.${cat}`;
    const categoryName = t(translationKey);
    // Check if any product has this category name
    return availableCategories.has(categoryName) || availableCategories.has(cat);
  });
  
  app.innerHTML = `
    <div class="public-categories-page">
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
      
      <div class="category-selection-page" style="padding: 48px 24px;">
        <div class="page-header" style="text-align: center; margin-bottom: 48px;">
          <h1>${t('categories.title')}</h1>
          <p style="font-size: 18px; color: var(--text-secondary); margin-top: 12px;">
            ${t('categories.subtitle')}
          </p>
        </div>
        
        ${categoriesToShow.length === 0 ? `
          <div class="empty-state">
            <i data-lucide="package-open" style="width: 64px; height: 64px; opacity: 0.3;"></i>
            <h2>${t('categories.noProductsInCategory')}</h2>
            <p>${t('categories.contactSupport')}</p>
            <p><strong>${t('categories.contactSupportEmail')}</strong></p>
          </div>
        ` : `
          <div class="categories-grid">
            ${categoriesToShow.map(cat => {
              const translationKey = `categories.${cat}`;
              const categoryName = t(translationKey);
              return `
                <div class="category-tile card" data-category="${escapeHtml(categoryName)}" style="cursor: pointer;">
                  <div class="category-icon">
                    <i data-lucide="package"></i>
                  </div>
                  <h3>${categoryName}</h3>
                  <p style="margin-top: 8px; font-size: 14px; color: var(--text-muted);">Browse products</p>
                </div>
              `;
            }).join('')}
          </div>
        `}
        
        <div style="text-align: center; margin-top: 48px; padding: 24px; background: var(--background-secondary); border-radius: 8px;">
          <p style="margin-bottom: 12px; font-size: 16px; font-weight: 500;">Ready to start shopping?</p>
          <p style="margin-bottom: 16px;">Sign in or create an account to browse products and place orders</p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button class="btn btn-secondary" data-nav="login">Login</button>
            <button class="btn btn-primary" data-nav="signup">Sign Up</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  if (window.lucide) window.lucide.createIcons();
  
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
  
  // Add event listeners for category selection
  document.querySelectorAll('.category-tile').forEach(tile => {
    tile.addEventListener('click', async () => {
      const category = tile.dataset.category;
      // Navigate directly to guest catalog to browse products
      router.navigate(`/guest/catalog?category=${encodeURIComponent(category)}`);
    });
  });
}
