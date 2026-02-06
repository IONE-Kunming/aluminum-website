import { useState } from 'react';
import { Search, Filter, ShoppingCart, Package } from 'lucide-react';
import { toast } from 'sonner';
import '../styles/Pages.css';

// Mock product data
const mockProducts = [
  {
    id: 1,
    name: 'Aluminum Sheet 6061-T6',
    category: 'Sheets',
    description: 'High-quality aluminum sheet with excellent corrosion resistance',
    price: 25,
    unit: 'kg',
    minOrder: 100,
    stock: 5000,
    seller: 'AlumaTech Industries',
    image: '/placeholder-product.jpg'
  },
  {
    id: 2,
    name: 'Aluminum Extrusion Profile',
    category: 'Extrusions',
    description: 'Custom aluminum extrusion profiles for industrial applications',
    price: 35,
    unit: 'unit',
    minOrder: 50,
    stock: 2000,
    seller: 'Metro Aluminum Co.',
    image: '/placeholder-product.jpg'
  },
  {
    id: 3,
    name: 'Aluminum Rod 2024-T4',
    category: 'Rods',
    description: 'Precision aluminum rods for aerospace and automotive use',
    price: 45,
    unit: 'kg',
    minOrder: 50,
    stock: 1500,
    seller: 'Premium Metals Ltd.',
    image: '/placeholder-product.jpg'
  },
  {
    id: 4,
    name: 'Aluminum Plate 7075',
    category: 'Plates',
    description: 'Heavy-duty aluminum plates with high strength-to-weight ratio',
    price: 55,
    unit: 'kg',
    minOrder: 25,
    stock: 800,
    seller: 'AlumaTech Industries',
    image: '/placeholder-product.jpg'
  },
  {
    id: 5,
    name: 'Aluminum Coil 3003',
    category: 'Coils',
    description: 'Flexible aluminum coils for roofing and construction',
    price: 30,
    unit: 'kg',
    minOrder: 200,
    stock: 3000,
    seller: 'BuildPro Metals',
    image: '/placeholder-product.jpg'
  },
  {
    id: 6,
    name: 'Aluminum Bar 6063',
    category: 'Bars',
    description: 'Extruded aluminum bars for architectural applications',
    price: 28,
    unit: 'kg',
    minOrder: 75,
    stock: 2500,
    seller: 'Metro Aluminum Co.',
    image: '/placeholder-product.jpg'
  }
];

const categories = ['All', 'Sheets', 'Extrusions', 'Rods', 'Plates', 'Coils', 'Bars'];

const CatalogPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product) => {
    setCart([...cart, product]);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="catalog-page">
      <div className="page-header">
        <h1>Product Catalog</h1>
        <p>Browse our extensive collection of aluminum products</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="catalog-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={18} />
          <span>Category:</span>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <a href="/buyer/cart" className="btn btn-secondary">
          <ShoppingCart size={18} />
          Cart ({cart.length})
        </a>
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {filteredProducts.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image">
              <Package size={48} />
            </div>
            <div className="product-info">
              <span className="product-category">{product.category}</span>
              <h3>{product.name}</h3>
              <p className="product-description">{product.description}</p>
              
              <div className="product-details">
                <div className="detail-item">
                  <span className="label">Price:</span>
                  <span className="value">${product.price}/{product.unit}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Min Order:</span>
                  <span className="value">{product.minOrder} {product.unit}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Stock:</span>
                  <span className="value">{product.stock} {product.unit}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Seller:</span>
                  <span className="value">{product.seller}</span>
                </div>
              </div>

              <button 
                className="btn btn-primary btn-block"
                onClick={() => handleAddToCart(product)}
              >
                <ShoppingCart size={18} />
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="empty-state">
          <Package size={48} />
          <h3>No products found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
