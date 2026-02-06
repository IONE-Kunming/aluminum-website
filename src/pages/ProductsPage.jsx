import { useState } from 'react';
import { Package, Plus, Edit, Trash2, Search, Upload } from 'lucide-react';
import { toast } from 'sonner';
import '../styles/Pages.css';

// Mock products data
const mockProducts = [
  {
    id: 1,
    name: 'Aluminum Sheet 6061-T6',
    category: 'Sheets',
    description: 'High-quality aluminum sheet with excellent corrosion resistance',
    price: 25,
    unit: 'kg',
    stock: 5000,
    minOrder: 100,
    sku: 'ALU-SHT-6061'
  },
  {
    id: 2,
    name: 'Aluminum Extrusion Profile',
    category: 'Extrusions',
    description: 'Custom aluminum extrusion profiles for industrial applications',
    price: 35,
    unit: 'unit',
    stock: 2000,
    minOrder: 50,
    sku: 'ALU-EXT-001'
  },
  {
    id: 3,
    name: 'Aluminum Plate 7075',
    category: 'Plates',
    description: 'Heavy-duty aluminum plates with high strength-to-weight ratio',
    price: 55,
    unit: 'kg',
    stock: 800,
    minOrder: 25,
    sku: 'ALU-PLT-7075'
  }
];

const ProductsPage = () => {
  const [products, setProducts] = useState(mockProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Sheets',
    description: '',
    price: '',
    unit: 'kg',
    stock: '',
    minOrder: '',
    sku: ''
  });

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Sheets',
      description: '',
      price: '',
      unit: 'kg',
      stock: '',
      minOrder: '',
      sku: ''
    });
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
      toast.success('Product deleted successfully');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id ? { ...formData, id: p.id } : p
      ));
      toast.success('Product updated successfully');
    } else {
      setProducts([...products, { ...formData, id: Date.now() }]);
      toast.success('Product added successfully');
    }
    setShowModal(false);
  };

  const getStockStatus = (stock) => {
    if (stock > 1000) return { label: 'In Stock', className: 'status-delivered' };
    if (stock > 500) return { label: 'Low Stock', className: 'status-transit' };
    return { label: 'Very Low', className: 'status-pending' };
  };

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <h1>
            <Package size={32} />
            Product Management
          </h1>
          <p>Manage your product catalog</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="page-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Min Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock);
              return (
                <tr key={product.id}>
                  <td className="font-medium">{product.sku}</td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>${product.price}/{product.unit}</td>
                  <td>{product.stock} {product.unit}</td>
                  <td>{product.minOrder} {product.unit}</td>
                  <td>
                    <span className={`status-badge ${stockStatus.className}`}>
                      {stockStatus.label}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon"
                        onClick={() => handleEdit(product)}
                        title="Edit Product"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        className="btn-icon btn-danger"
                        onClick={() => handleDelete(product.id)}
                        title="Delete Product"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredProducts.length === 0 && (
        <div className="empty-state">
          <Package size={48} />
          <h3>No products found</h3>
          <p>Add your first product to get started</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>SKU *</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required
                    >
                      <option value="Sheets">Sheets</option>
                      <option value="Extrusions">Extrusions</option>
                      <option value="Rods">Rods</option>
                      <option value="Plates">Plates</option>
                      <option value="Coils">Coils</option>
                      <option value="Bars">Bars</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Unit *</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      required
                    >
                      <option value="kg">kg</option>
                      <option value="unit">unit</option>
                      <option value="ton">ton</option>
                      <option value="meter">meter</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>Price per Unit *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Stock Quantity *</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Minimum Order *</label>
                    <input
                      type="number"
                      value={formData.minOrder}
                      onChange={(e) => setFormData({...formData, minOrder: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Product Image</label>
                    <div className="upload-placeholder">
                      <Upload size={24} />
                      <p>Click to upload or drag and drop</p>
                      <small>PNG, JPG up to 5MB</small>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
