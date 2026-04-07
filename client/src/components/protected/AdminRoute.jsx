/**
 * AdminRoute component
 * Redirects non-admin users to home page
 * @module components/protected/AdminRoute
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Spinner from '../ui/Spinner';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin' && user?.role !== 'developer') {
    return <Navigate to="/" replace />;
  }

  return children || <Outlet />;
};

export default AdminRoute;

// MukonoTalks

