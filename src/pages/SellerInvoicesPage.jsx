import { useState } from 'react';
import { FileText, Search, Download, Eye, Filter, Plus } from 'lucide-react';
import { toast } from 'sonner';

// Mock invoices data for seller
const mockSellerInvoices = [
  {
    id: 'INV-001',
    orderId: 'ORD-001',
    date: '2024-01-15',
    dueDate: '2024-02-15',
    customer: 'ABC Manufacturing',
    customerEmail: 'orders@abcmfg.com',
    amount: 12500,
    status: 'Paid',
    paidDate: '2024-01-16'
  },
  {
    id: 'INV-002',
    orderId: 'ORD-002',
    date: '2024-01-14',
    dueDate: '2024-02-14',
    customer: 'TechCorp Industries',
    customerEmail: 'purchasing@techcorp.com',
    amount: 25000,
    status: 'Sent',
    paidDate: null
  },
  {
    id: 'INV-003',
    orderId: 'ORD-003',
    date: '2024-01-12',
    dueDate: '2024-02-12',
    customer: 'BuildRight Construction',
    customerEmail: 'materials@buildright.com',
    amount: 8500,
    status: 'Draft',
    paidDate: null
  },
  {
    id: 'INV-004',
    orderId: 'ORD-004',
    date: '2024-01-10',
    dueDate: '2024-02-10',
    customer: 'Aerospace Dynamics',
    customerEmail: 'supply@aerodynamics.com',
    amount: 15000,
    status: 'Paid',
    paidDate: '2024-01-11'
  }
];

const SellerInvoicesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const filteredInvoices = mockSellerInvoices.filter(invoice => {
    const matchesSearch = invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'status-delivered';
      case 'Sent':
        return 'status-transit';
      case 'Draft':
        return 'status-processing';
      case 'Overdue':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  const handleDownload = (invoice) => {
    toast.success(`Downloading invoice ${invoice.id}`);
  };

  const handleSend = (invoice) => {
    toast.success(`Invoice ${invoice.id} sent to ${invoice.customer}`);
  };

  return (
    <div className="seller-invoices-page">
      <div className="page-header">
        <div>
          <h1>
            <FileText size={32} />
            Invoice Management
          </h1>
          <p>Create and manage invoices</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} />
          Create Invoice
        </button>
      </div>

      {/* Controls */}
      <div className="page-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search invoices..."
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
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Invoices</h3>
          <p className="stat-value">{mockSellerInvoices.length}</p>
        </div>
        <div className="stat-card">
          <h3>Paid</h3>
          <p className="stat-value" style={{ color: '#388e3c' }}>
            ${mockSellerInvoices.filter(i => i.status === 'Paid')
              .reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-value" style={{ color: '#f57c00' }}>
            ${mockSellerInvoices.filter(i => i.status !== 'Paid')
              .reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="stat-card">
          <h3>Draft</h3>
          <p className="stat-value">
            {mockSellerInvoices.filter(i => i.status === 'Draft').length}
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Order ID</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="font-medium">{invoice.id}</td>
                <td>{invoice.orderId}</td>
                <td>{invoice.date}</td>
                <td>{invoice.dueDate}</td>
                <td>
                  <div>
                    <div className="font-medium">{invoice.customer}</div>
                    <div className="text-muted">{invoice.customerEmail}</div>
                  </div>
                </td>
                <td className="font-medium">${invoice.amount.toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-icon"
                      title="View Invoice"
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      className="btn-icon"
                      title="Download PDF"
                      onClick={() => handleDownload(invoice)}
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

      {filteredInvoices.length === 0 && (
        <div className="empty-state">
          <FileText size={48} />
          <h3>No invoices found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Invoice Details</h2>
              <button 
                className="btn-close"
                onClick={() => setSelectedInvoice(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="invoice-preview">
                <div className="invoice-header">
                  <h3>INVOICE</h3>
                  <p className="invoice-number">{selectedInvoice.id}</p>
                </div>

                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Invoice Date:</span>
                    <span className="value">{selectedInvoice.date}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Due Date:</span>
                    <span className="value">{selectedInvoice.dueDate}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Order ID:</span>
                    <span className="value">{selectedInvoice.orderId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span className={`status-badge ${getStatusColor(selectedInvoice.status)}`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Customer:</span>
                    <span className="value">{selectedInvoice.customer}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{selectedInvoice.customerEmail}</span>
                  </div>
                  {selectedInvoice.paidDate && (
                    <div className="detail-item">
                      <span className="label">Paid Date:</span>
                      <span className="value">{selectedInvoice.paidDate}</span>
                    </div>
                  )}
                </div>

                <div className="invoice-amount">
                  <div className="amount-row">
                    <span>Subtotal:</span>
                    <span>${selectedInvoice.amount.toLocaleString()}</span>
                  </div>
                  <div className="amount-row">
                    <span>Tax (10%):</span>
                    <span>${(selectedInvoice.amount * 0.1).toLocaleString()}</span>
                  </div>
                  <div className="amount-row total">
                    <span>Total Amount:</span>
                    <span>${(selectedInvoice.amount * 1.1).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedInvoice(null)}>
                Close
              </button>
              {selectedInvoice.status === 'Draft' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => handleSend(selectedInvoice)}
                >
                  Send Invoice
                </button>
              )}
              <button 
                className="btn btn-primary"
                onClick={() => handleDownload(selectedInvoice)}
              >
                <Download size={18} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerInvoicesPage;
