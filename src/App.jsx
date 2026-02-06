import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Loading component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'var(--dark-bg)'
  }}>
    <div className="spinner"></div>
  </div>
);

// Lazy load all pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ProfileSelectionPage = lazy(() => import('./pages/ProfileSelectionPage'));

// Buyer Pages
const BuyerDashboard = lazy(() => import('./pages/BuyerDashboard'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const SellersPage = lazy(() => import('./pages/SellersPage'));

// Seller Pages
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const SellerOrdersPage = lazy(() => import('./pages/SellerOrdersPage'));
const SellerInvoicesPage = lazy(() => import('./pages/SellerInvoicesPage'));
const BranchesPage = lazy(() => import('./pages/BranchesPage'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Shared Pages
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

import './App.css';

function App() {
  return (
    <Router basename="/aluminum-website">
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
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

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requireRole="admin">
                <Layout><AdminDashboard /></Layout>
              </ProtectedRoute>
            } />

            {/* Default Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Toaster position="top-right" richColors />
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
