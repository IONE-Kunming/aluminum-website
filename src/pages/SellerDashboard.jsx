import { useAuth } from '../context/AuthContext';
import { Package, ShoppingBag, DollarSign, TrendingUp, AlertCircle, Users } from 'lucide-react';

// Mock data for demo
const mockStats = {
  totalProducts: 48,
  totalOrders: 156,
  revenue: 485000,
  activeOrders: 12
};

const mockProducts = [
  {
    id: 'PROD-001',
    name: 'Aluminum Sheet 6061-T6',
    category: 'Sheets',
    stock: 500,
    price: 25,
    unit: 'kg',
    sales: 1200
  },
  {
    id: 'PROD-002',
    name: 'Aluminum Extrusion Profile',
    category: 'Extrusions',
    stock: 800,
    price: 35,
    unit: 'unit',
    sales: 950
  },
  {
    id: 'PROD-003',
    name: 'Aluminum Rod 2024-T4',
    category: 'Rods',
    stock: 250,
    price: 45,
    unit: 'kg',
    sales: 680
  },
  {
    id: 'PROD-004',
    name: 'Aluminum Plate 7075',
    category: 'Plates',
    stock: 150,
    price: 55,
    unit: 'kg',
    sales: 520
  }
];

const SellerDashboard = () => {
  const { userProfile } = useAuth();

  const getStockStatus = (stock) => {
    if (stock > 400) return { label: 'In Stock', className: 'status-delivered' };
    if (stock > 200) return { label: 'Low Stock', className: 'status-transit' };
    return { label: 'Very Low', className: 'status-pending' };
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {userProfile?.displayName}!</h1>
          <p className="dashboard-subtitle">Here's an overview of your business performance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e3f2fd' }}>
            <Package size={24} color="#1976d2" />
          </div>
          <div className="stat-content">
            <h3>Total Products</h3>
            <p className="stat-value">{mockStats.totalProducts}</p>
            <span className="stat-label">Active listings</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fff3e0' }}>
            <ShoppingBag size={24} color="#f57c00" />
          </div>
          <div className="stat-content">
            <h3>Total Orders</h3>
            <p className="stat-value">{mockStats.totalOrders}</p>
            <span className="stat-change positive">
              <TrendingUp size={16} />
              +15% from last month
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e8f5e9' }}>
            <DollarSign size={24} color="#388e3c" />
          </div>
          <div className="stat-content">
            <h3>Revenue</h3>
            <p className="stat-value">${mockStats.revenue.toLocaleString()}</p>
            <span className="stat-change positive">
              <TrendingUp size={16} />
              +22% from last month
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f3e5f5' }}>
            <Users size={24} color="#7b1fa2" />
          </div>
          <div className="stat-content">
            <h3>Active Orders</h3>
            <p className="stat-value">{mockStats.activeOrders}</p>
            <span className="stat-label">Awaiting processing</span>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {mockProducts.filter(p => p.stock < 300).length > 0 && (
        <div className="alert alert-warning">
          <AlertCircle size={20} />
          <div>
            <strong>Low Stock Alert</strong>
            <p>{mockProducts.filter(p => p.stock < 300).length} products are running low on stock</p>
          </div>
        </div>
      )}

      {/* Products Overview */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Products Overview</h2>
          <a href="/seller/products" className="btn btn-text">Manage Products</a>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Total Sales</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mockProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                return (
                  <tr key={product.id}>
                    <td className="font-medium">{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.stock} {product.unit}</td>
                    <td className="font-medium">${product.price}/{product.unit}</td>
                    <td>{product.sales} units</td>
                    <td>
                      <span className={`status-badge ${stockStatus.className}`}>
                        {stockStatus.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <a href="/seller/products" className="action-button">
            <Package size={20} />
            Add Product
          </a>
          <a href="/seller/orders" className="action-button">
            <ShoppingBag size={20} />
            View Orders
          </a>
          <a href="/seller/invoices" className="action-button">
            <DollarSign size={20} />
            Create Invoice
          </a>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
