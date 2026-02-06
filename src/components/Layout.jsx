import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  User,
  Store,
  GitBranch,
  HelpCircle,
  Bell,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import '../styles/Layout.css';

const Layout = ({ children }) => {
  const { signOut, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const buyerMenuItems = [
    { path: '/buyer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/buyer/catalog', icon: Package, label: 'Product Catalog' },
    { path: '/buyer/cart', icon: ShoppingCart, label: 'Shopping Cart' },
    { path: '/buyer/orders', icon: FileText, label: 'My Orders' },
    { path: '/buyer/invoices', icon: FileText, label: 'Invoices' },
    { path: '/buyer/sellers', icon: Store, label: 'Sellers Directory' },
    { path: '/buyer/support', icon: HelpCircle, label: 'Support' },
    { path: '/buyer/notifications', icon: Bell, label: 'Notifications' },
    { path: '/buyer/profile', icon: User, label: 'Profile' },
  ];

  const sellerMenuItems = [
    { path: '/seller/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/seller/products', icon: Package, label: 'My Products' },
    { path: '/seller/orders', icon: FileText, label: 'Orders' },
    { path: '/seller/invoices', icon: FileText, label: 'Invoices' },
    { path: '/seller/branches', icon: GitBranch, label: 'Branches' },
    { path: '/seller/support', icon: HelpCircle, label: 'Support' },
    { path: '/seller/notifications', icon: Bell, label: 'Notifications' },
    { path: '/seller/profile', icon: User, label: 'Profile' },
  ];

  const menuItems = userProfile?.role === 'seller' ? sellerMenuItems : buyerMenuItems;

  return (
    <div className="layout">
      {/* Mobile Menu Button */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="logo">IONE</h1>
          <p className="logo-subtitle">AlumaTech Industries</p>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          <button onClick={handleSignOut} className="nav-item logout-btn">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <p className="user-name">{userProfile?.displayName || 'User'}</p>
              <p className="user-role">{userProfile?.role || 'guest'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
