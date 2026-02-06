import { useState } from 'react';
import { MapPin, Plus, Edit, Trash2, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

// Mock branches data
const mockBranches = [
  {
    id: 1,
    name: 'Main Headquarters',
    address: '123 Industrial Park Drive',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90001',
    country: 'USA',
    phone: '+1 (555) 123-4567',
    email: 'headquarters@alumatech.com',
    manager: 'John Smith',
    isMain: true
  },
  {
    id: 2,
    name: 'East Coast Distribution',
    address: '456 Commerce Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    phone: '+1 (555) 234-5678',
    email: 'eastcoast@alumatech.com',
    manager: 'Sarah Johnson',
    isMain: false
  },
  {
    id: 3,
    name: 'Midwest Warehouse',
    address: '789 Supply Avenue',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    country: 'USA',
    phone: '+1 (555) 345-6789',
    email: 'midwest@alumatech.com',
    manager: 'Michael Brown',
    isMain: false
  }
];

const BranchesPage = () => {
  const [branches, setBranches] = useState(mockBranches);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    phone: '',
    email: '',
    manager: '',
    isMain: false
  });

  const handleAdd = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
      phone: '',
      email: '',
      manager: '',
      isMain: false
    });
    setShowModal(true);
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData(branch);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    const branch = branches.find(b => b.id === id);
    if (branch.isMain) {
      toast.error('Cannot delete main headquarters');
      return;
    }
    if (window.confirm('Are you sure you want to delete this branch?')) {
      setBranches(branches.filter(b => b.id !== id));
      toast.success('Branch deleted successfully');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBranch) {
      setBranches(branches.map(b => 
        b.id === editingBranch.id ? { ...formData, id: b.id } : b
      ));
      toast.success('Branch updated successfully');
    } else {
      setBranches([...branches, { ...formData, id: Date.now() }]);
      toast.success('Branch added successfully');
    }
    setShowModal(false);
  };

  return (
    <div className="branches-page">
      <div className="page-header">
        <div>
          <h1>
            <MapPin size={32} />
            Branch Management
          </h1>
          <p>Manage your business locations</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={18} />
          Add Branch
        </button>
      </div>

      {/* Branches Grid */}
      <div className="branches-grid">
        {branches.map((branch) => (
          <div key={branch.id} className={`branch-card ${branch.isMain ? 'main-branch' : ''}`}>
            {branch.isMain && (
              <div className="main-badge">Main Headquarters</div>
            )}
            
            <div className="branch-header">
              <MapPin size={24} />
              <h3>{branch.name}</h3>
            </div>

            <div className="branch-info">
              <div className="info-item">
                <MapPin size={16} />
                <div>
                  <div>{branch.address}</div>
                  <div>{branch.city}, {branch.state} {branch.zipCode}</div>
                  <div>{branch.country}</div>
                </div>
              </div>

              <div className="info-item">
                <Phone size={16} />
                <span>{branch.phone}</span>
              </div>

              <div className="info-item">
                <Mail size={16} />
                <span>{branch.email}</span>
              </div>

              <div className="info-item">
                <strong>Manager:</strong>
                <span>{branch.manager}</span>
              </div>
            </div>

            <div className="branch-actions">
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => handleEdit(branch)}
              >
                <Edit size={16} />
                Edit
              </button>
              {!branch.isMain && (
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(branch.id)}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {branches.length === 0 && (
        <div className="empty-state">
          <MapPin size={48} />
          <h3>No branches found</h3>
          <p>Add your first branch to get started</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Branch Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Address *</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>State *</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>ZIP Code *</label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Country *</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Manager Name</label>
                    <input
                      type="text"
                      value={formData.manager}
                      onChange={(e) => setFormData({...formData, manager: e.target.value})}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.isMain}
                        onChange={(e) => setFormData({...formData, isMain: e.target.checked})}
                      />
                      Mark as Main Headquarters
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBranch ? 'Update Branch' : 'Add Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchesPage;
