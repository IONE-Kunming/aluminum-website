import { useState } from 'react';
import { Package, Search, Filter, Eye, Download } from 'lucide-react';
import '../styles/Pages.css';

// Mock orders data
const mockOrders = [
  {
    id: 'ORD-001',
    date: '2024-01-15',
    product: 'Aluminum Sheet 6061-T6',
    quantity: '500 kg',
    total: 12500,
    status: 'Delivered',
    seller: 'AlumaTech Industries',
    trackingNumber: 'TRK-12345',
    deliveryDate: '2024-01-18'
  },
  {
    id: 'ORD-002',
    date: '2024-01-14',
    product: 'Aluminum Extrusion Profile',
    quantity: '1000 units',
    total: 25000,
    status: 'In Transit',
    seller: 'Metro Aluminum Co.',
    trackingNumber: 'TRK-12346',
    estimatedDelivery: '2024-01-20'
  },
  {
    id: 'ORD-003',
    date: '2024-01-12',
    product: 'Aluminum Rod 2024-T4',
    quantity: '300 kg',
    total: 8500,
    status: 'Processing',
    seller: 'Premium Metals Ltd.',
    trackingNumber: 'TRK-12347',
    estimatedDelivery: '2024-01-22'
  },
  {
    id: 'ORD-004',
    date: '2024-01-10',
    product: 'Aluminum Plate 7075',
    quantity: '200 kg',
    total: 15000,
    status: 'Delivered',
    seller: 'AlumaTech Industries',
    trackingNumber: 'TRK-12348',
    deliveryDate: '2024-01-13'
  },
  {
    id: 'ORD-005',
    date: '2024-01-08',
    product: 'Aluminum Coil 3003',
    quantity: '750 kg',
    total: 18000,
    status: 'Cancelled',
    seller: 'BuildPro Metals',
    trackingNumber: 'TRK-12349',
    cancelledDate: '2024-01-09'
  }
];

const OrdersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.product.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'status-delivered';
      case 'In Transit':
        return 'status-transit';
      case 'Processing':
        return 'status-processing';
      case 'Cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1>
          <Package size={32} />
          My Orders
        </h1>
        <p>Track and manage your orders</p>
      </div>

      {/* Controls */}
      <div className="page-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={18} />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Processing">Processing</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
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
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-icon"
                      title="View Details"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      className="btn-icon"
                      title="Download Invoice"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredOrders.length === 0 && (
        <div className="empty-state">
          <Package size={48} />
          <h3>No orders found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button 
                className="btn-close"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Order ID:</span>
                  <span className="value">{selectedOrder.id}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className={`status-badge ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Order Date:</span>
                  <span className="value">{selectedOrder.date}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Product:</span>
                  <span className="value">{selectedOrder.product}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Quantity:</span>
                  <span className="value">{selectedOrder.quantity}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Seller:</span>
                  <span className="value">{selectedOrder.seller}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Tracking Number:</span>
                  <span className="value">{selectedOrder.trackingNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Total Amount:</span>
                  <span className="value font-medium">
                    ${selectedOrder.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
              <button className="btn btn-primary">
                <Download size={18} />
                Download Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
