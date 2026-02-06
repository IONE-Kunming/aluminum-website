import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Package, DollarSign, Clock, CheckCircle, TrendingUp, Store } from 'lucide-react';

// Mock data for demo
const mockStats = {
  totalOrders: 24,
  activeOrders: 5,
  totalSpent: 125000,
  completedOrders: 19
};

const mockRecentOrders = [
  {
    id: 'ORD-001',
    date: '2024-01-15',
    product: 'Aluminum Sheet 6061-T6',
    quantity: '500 kg',
    total: 12500,
    status: 'Delivered',
    seller: 'AlumaTech Industries'
  },
  {
    id: 'ORD-002',
    date: '2024-01-14',
    product: 'Aluminum Extrusion Profile',
    quantity: '1000 units',
    total: 25000,
    status: 'In Transit',
    seller: 'Metro Aluminum Co.'
  },
  {
    id: 'ORD-003',
    date: '2024-01-12',
    product: 'Aluminum Rod 2024-T4',
    quantity: '300 kg',
    total: 8500,
    status: 'Processing',
    seller: 'Premium Metals Ltd.'
  },
  {
    id: 'ORD-004',
    date: '2024-01-10',
    product: 'Aluminum Plate 7075',
    quantity: '200 kg',
    total: 15000,
    status: 'Delivered',
    seller: 'AlumaTech Industries'
  }
];

const BuyerDashboard = () => {
  const { userProfile } = useAuth();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'status-delivered';
      case 'In Transit':
        return 'status-transit';
      case 'Processing':
        return 'status-processing';
      default:
        return 'status-pending';
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {userProfile?.displayName}!</h1>
          <p className="dashboard-subtitle">Here's what's happening with your orders today</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e3f2fd' }}>
            <Package size={24} color="#1976d2" />
          </div>
          <div className="stat-content">
            <h3>Total Orders</h3>
            <p className="stat-value">{mockStats.totalOrders}</p>
            <span className="stat-change positive">
              <TrendingUp size={16} />
              +12% from last month
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fff3e0' }}>
            <Clock size={24} color="#f57c00" />
          </div>
          <div className="stat-content">
            <h3>Active Orders</h3>
            <p className="stat-value">{mockStats.activeOrders}</p>
            <span className="stat-label">Currently in progress</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e8f5e9' }}>
            <DollarSign size={24} color="#388e3c" />
          </div>
          <div className="stat-content">
            <h3>Total Spent</h3>
            <p className="stat-value">${mockStats.totalSpent.toLocaleString()}</p>
            <span className="stat-change positive">
              <TrendingUp size={16} />
              +8% from last month
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f3e5f5' }}>
            <CheckCircle size={24} color="#7b1fa2" />
          </div>
          <div className="stat-content">
            <h3>Completed</h3>
            <p className="stat-value">{mockStats.completedOrders}</p>
            <span className="stat-label">Successfully delivered</span>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Orders</h2>
          <a href="/buyer/orders" className="btn btn-text">View All</a>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Seller</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mockRecentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="font-medium">{order.id}</td>
                  <td>{order.date}</td>
                  <td>{order.product}</td>
                  <td>{order.quantity}</td>
                  <td>{order.seller}</td>
                  <td className="font-medium">${order.total.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <a href="/buyer/catalog" className="action-button">
            <ShoppingCart size={20} />
            Browse Catalog
          </a>
          <a href="/buyer/orders" className="action-button">
            <Package size={20} />
            View Orders
          </a>
          <a href="/buyer/sellers" className="action-button">
            <Store size={20} />
            Find Sellers
          </a>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
