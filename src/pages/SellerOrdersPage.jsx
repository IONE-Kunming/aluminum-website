import { useState } from 'react';
import { ShoppingBag, Search, Filter, Eye, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import '../styles/Pages.css';

// Mock orders data for seller
const mockSellerOrders = [
  {
    id: 'ORD-001',
    date: '2024-01-15',
    customer: 'ABC Manufacturing',
    customerEmail: 'orders@abcmfg.com',
    product: 'Aluminum Sheet 6061-T6',
    quantity: '500 kg',
    total: 12500,
    status: 'Delivered',
    shippingAddress: '123 Industrial Park, Los Angeles, CA'
  },
  {
    id: 'ORD-002',
    date: '2024-01-14',
    customer: 'TechCorp Industries',
    customerEmail: 'purchasing@techcorp.com',
    product: 'Aluminum Extrusion Profile',
    quantity: '1000 units',
    total: 25000,
    status: 'In Transit',
    shippingAddress: '456 Tech Drive, San Francisco, CA'
  },
  {
    id: 'ORD-003',
    date: '2024-01-12',
    customer: 'BuildRight Construction',
    customerEmail: 'materials@buildright.com',
    product: 'Aluminum Rod 2024-T4',
    quantity: '300 kg',
    total: 8500,
    status: 'Processing',
    shippingAddress: '789 Builder Blvd, Chicago, IL'
  },
  {
    id: 'ORD-004',
    date: '2024-01-10',
    customer: 'Aerospace Dynamics',
    customerEmail: 'supply@aerodynamics.com',
    product: 'Aluminum Plate 7075',
    quantity: '200 kg',
    total: 15000,
    status: 'Pending',
    shippingAddress: '321 Aviation Way, Houston, TX'
  }
];

const SellerOrdersPage = () => {
  const [orders, setOrders] = useState(mockSellerOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchQuery.toLowerCase());
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
      case 'Pending':
        return 'status-pending';
      default:
        return 'status-pending';
    }
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    toast.success(`Order ${orderId} status updated to ${newStatus}`);
  };

  return (
    <div className="seller-orders-page">
      <div className="page-header">
        <h1>
          <ShoppingBag size={32} />
          Order Management
        </h1>
        <p>Manage and process customer orders</p>
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
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
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
              <th>Customer</th>
              <th>Product</th>
              <th>Quantity</th>
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
                <td>
                  <div>
                    <div className="font-medium">{order.customer}</div>
                    <div className="text-muted">{order.customerEmail}</div>
                  </div>
                </td>
                <td>{order.product}</td>
                <td>{order.quantity}</td>
                <td className="font-medium">${order.total.toLocaleString()}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    className={`status-select ${getStatusColor(order.status)}`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Delivered">Delivered</option>
                  </select>
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
                      title="Mark as Complete"
                      onClick={() => handleStatusUpdate(order.id, 'Delivered')}
                    >
                      <CheckCircle size={18} />
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
          <ShoppingBag size={48} />
          <h3>No orders found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details - {selectedOrder.id}</h2>
              <button 
                className="btn-close"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-sections">
                <div className="detail-section">
                  <h3>Customer Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Name:</span>
                      <span className="value">{selectedOrder.customer}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Email:</span>
                      <span className="value">{selectedOrder.customerEmail}</span>
                    </div>
                    <div className="detail-item full-width">
                      <span className="label">Shipping Address:</span>
                      <span className="value">{selectedOrder.shippingAddress}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Order Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Order Date:</span>
                      <span className="value">{selectedOrder.date}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Status:</span>
                      <span className={`status-badge ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
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
                      <span className="label">Total Amount:</span>
                      <span className="value font-medium">
                        ${selectedOrder.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
              <button className="btn btn-primary">
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOrdersPage;
