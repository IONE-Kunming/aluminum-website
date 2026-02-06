import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Store } from 'lucide-react';
import { toast } from 'sonner';
import '../styles/AuthPages.css';

// Profile selection page for users who sign in with Google
const ProfileSelectionPage = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = async () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    setLoading(true);

    try {
      await updateUserProfile({ role: selectedRole });
      toast.success('Profile updated successfully!');
      
      // Navigate based on selected role
      if (selectedRole === 'seller') {
        navigate('/seller/dashboard');
      } else {
        navigate('/buyer/dashboard');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container profile-selection-container">
        <div className="auth-header">
          <h1 className="auth-logo">IONE</h1>
          <p className="auth-subtitle">AlumaTech Industries</p>
          <h2 className="auth-title">Choose Your Role</h2>
          <p className="auth-description">Select how you want to use the platform</p>
        </div>

        <div className="role-cards">
          <div 
            className={`role-card ${selectedRole === 'buyer' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('buyer')}
          >
            <div className="role-card-icon">
              <ShoppingCart size={48} />
            </div>
            <h3>Buyer</h3>
            <p>Browse products, place orders, and manage purchases</p>
            <ul className="role-features">
              <li>Access product catalog</li>
              <li>Place and track orders</li>
              <li>Manage invoices</li>
              <li>Contact sellers</li>
            </ul>
          </div>

          <div 
            className={`role-card ${selectedRole === 'seller' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('seller')}
          >
            <div className="role-card-icon">
              <Store size={48} />
            </div>
            <h3>Seller</h3>
            <p>List products, manage inventory, and process orders</p>
            <ul className="role-features">
              <li>Manage product listings</li>
              <li>Process customer orders</li>
              <li>Generate invoices</li>
              <li>Manage branches</li>
            </ul>
          </div>
        </div>

        <button 
          className="btn btn-primary"
          onClick={handleRoleSelect}
          disabled={!selectedRole || loading}
        >
          {loading ? 'Updating...' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default ProfileSelectionPage;
