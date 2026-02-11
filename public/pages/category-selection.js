import { renderPageWithLayout } from '../js/layout.js';
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

export async function renderCategorySelection() {
  const t = languageManager.t.bind(languageManager);
  const user = authManager.getCurrentUser();
  
  if (!user) {
    router.navigate('/login');
    return;
  }
  
  // Get available categories (only those with products)
  const allProducts = await dataService.getProducts();
  const availableCategories = new Set();
  
  allProducts.forEach(product => {
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
  
  const content = `
    <div class="category-selection-page">
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
              </div>
            `;
          }).join('')}
        </div>
      `}
      
      <div style="text-align: center; margin-top: 48px; padding: 24px; background: var(--background-secondary); border-radius: 8px;">
        <p style="margin-bottom: 12px;">${t('categories.contactSupport')}</p>
        <p><strong>${t('categories.contactSupportEmail')}</strong></p>
      </div>
    </div>
  `;
  
  renderPageWithLayout(content, 'buyer');
  if (window.lucide) window.lucide.createIcons();
  
  // Add event listeners for category selection
  document.querySelectorAll('.category-tile').forEach(tile => {
    tile.addEventListener('click', async () => {
      const category = tile.dataset.category;
      
      // Store selected category in user profile
      try {
        await dataService.updateUserProfile({
          selectedCategory: category
        });
        
        // Navigate to catalog
        router.navigate('/buyer/catalog');
      } catch (error) {
        console.error('Error saving category selection:', error);
        if (window.toast) {
          window.toast.error('Failed to save category selection');
        }
      }
    });
  });
}
