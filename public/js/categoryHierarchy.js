// Category Hierarchy Configuration
// Defines the structure of main categories and their subcategories

export const CATEGORY_HIERARCHY = {
  'Construction': {
    name: 'Construction',
    subcategories: [
      'Balustrades',
      'Barrier Systems',
      'Fencing',
      'Handrails',
      'Gates',
      'Railings',
      'Screens',
      'Partitions',
      'Aluminum',
      'Steel',
      'Glass',
      'Concrete',
      'Tools',
      'Equipment',
      'Hardware',
      'Electrical',
      'Plumbing',
      'Paint',
      'Wood'
    ]
  }
  // Add more main categories here as needed
};

// Get all main categories
export function getMainCategories() {
  return Object.keys(CATEGORY_HIERARCHY);
}

// Get subcategories for a main category
export function getSubcategories(mainCategory) {
  return CATEGORY_HIERARCHY[mainCategory]?.subcategories || [];
}

// Get main category for a subcategory
export function getMainCategoryForSubcategory(subcategory) {
  for (const [mainCategory, config] of Object.entries(CATEGORY_HIERARCHY)) {
    if (config.subcategories.includes(subcategory)) {
      return mainCategory;
    }
  }
  return null;
}

// Check if a category is a main category
export function isMainCategory(category) {
  return category in CATEGORY_HIERARCHY;
}

// Check if a category is a subcategory
export function isSubcategory(category) {
  return getMainCategoryForSubcategory(category) !== null;
}

// Get all subcategories (flat list)
export function getAllSubcategories() {
  const allSubs = [];
  for (const config of Object.values(CATEGORY_HIERARCHY)) {
    allSubs.push(...config.subcategories);
  }
  return allSubs;
}

// Map product categories to hierarchy
export function mapCategoriesToHierarchy(productCategories) {
  const result = {
    mainCategories: new Set(),
    unmappedCategories: []
  };

  for (const category of productCategories) {
    if (isMainCategory(category)) {
      result.mainCategories.add(category);
    } else if (isSubcategory(category)) {
      const mainCat = getMainCategoryForSubcategory(category);
      if (mainCat) {
        result.mainCategories.add(mainCat);
      }
    } else {
      // Category not in hierarchy - treat as standalone
      result.unmappedCategories.push(category);
    }
  }

  return {
    mainCategories: Array.from(result.mainCategories),
    unmappedCategories: result.unmappedCategories
  };
}

export default CATEGORY_HIERARCHY;
