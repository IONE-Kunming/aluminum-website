import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireRole = null }) => {
  const { isAuthenticated, userProfile } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && userProfile?.role !== requireRole) {
    // Redirect to appropriate dashboard based on user's role
    if (userProfile?.role === 'buyer') {
      return <Navigate to="/buyer/dashboard" replace />;
    } else if (userProfile?.role === 'seller') {
      return <Navigate to="/seller/dashboard" replace />;
    }
    return <Navigate to="/profile-selection" replace />;
  }

  return children;
};

export default ProtectedRoute;
