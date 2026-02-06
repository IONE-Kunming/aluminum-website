import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Auth Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfileSelectionPage from './pages/ProfileSelectionPage';

// Buyer Pages
import BuyerDashboard from './pages/BuyerDashboard';
import CatalogPage from './pages/CatalogPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import InvoicesPage from './pages/InvoicesPage';
import SellersPage from './pages/SellersPage';

// Seller Pages
import SellerDashboard from './pages/SellerDashboard';
import ProductsPage from './pages/ProductsPage';
import SellerOrdersPage from './pages/SellerOrdersPage';
import SellerInvoicesPage from './pages/SellerInvoicesPage';
import BranchesPage from './pages/BranchesPage';

// Shared Pages
import ProfilePage from './pages/ProfilePage';
import SupportPage from './pages/SupportPage';
import NotificationsPage from './pages/NotificationsPage';

import './App.css';

function App() {
  return (
    <Router basename="/aluminum-website">
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/profile-selection" element={<ProfileSelectionPage />} />

          {/* Buyer Routes */}
          <Route path="/buyer/dashboard" element={
            <ProtectedRoute requireRole="buyer">
              <Layout><BuyerDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/buyer/catalog" element={
            <ProtectedRoute requireRole="buyer">
              <Layout><CatalogPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/buyer/cart" element={
            <ProtectedRoute requireRole="buyer">
              <Layout><CartPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/buyer/orders" element={
            <ProtectedRoute requireRole="buyer">
              <Layout><OrdersPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/buyer/invoices" element={
            <ProtectedRoute requireRole="buyer">
              <Layout><InvoicesPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/buyer/sellers" element={
            <ProtectedRoute requireRole="buyer">
              <Layout><SellersPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/buyer/support" element={
            <ProtectedRoute requireRole="buyer">
              <Layout><SupportPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/buyer/notifications" element={
            <ProtectedRoute requireRole="buyer">
              <Layout><NotificationsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/buyer/profile" element={
            <ProtectedRoute requireRole="buyer">
              <Layout><ProfilePage /></Layout>
            </ProtectedRoute>
          } />

          {/* Seller Routes */}
          <Route path="/seller/dashboard" element={
            <ProtectedRoute requireRole="seller">
              <Layout><SellerDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/seller/products" element={
            <ProtectedRoute requireRole="seller">
              <Layout><ProductsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/seller/orders" element={
            <ProtectedRoute requireRole="seller">
              <Layout><SellerOrdersPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/seller/invoices" element={
            <ProtectedRoute requireRole="seller">
              <Layout><SellerInvoicesPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/seller/branches" element={
            <ProtectedRoute requireRole="seller">
              <Layout><BranchesPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/seller/support" element={
            <ProtectedRoute requireRole="seller">
              <Layout><SupportPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/seller/notifications" element={
            <ProtectedRoute requireRole="seller">
              <Layout><NotificationsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/seller/profile" element={
            <ProtectedRoute requireRole="seller">
              <Layout><ProfilePage /></Layout>
            </ProtectedRoute>
          } />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        <Toaster position="top-right" richColors />
      </AuthProvider>
    </Router>
  );
}

export default App;
