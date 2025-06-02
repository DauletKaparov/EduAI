import React from 'react';
// Temporarily bypass authentication
// import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // TEMPORARY: Bypass all authentication checks
  // Always render children, no authentication required
  // This is only for testing purposes
  return <>{children}</>;
};

export default ProtectedRoute;
