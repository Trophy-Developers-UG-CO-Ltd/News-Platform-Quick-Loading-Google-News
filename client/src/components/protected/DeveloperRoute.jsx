/**
 * DeveloperRoute component
 * Redirects non-developer users back to admin dashboard
 * @module components/protected/DeveloperRoute
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Spinner from '../ui/Spinner';

const DeveloperRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'developer') {
    return <Navigate to="/admin" replace />;
  }

  return children || <Outlet />;
};

export default DeveloperRoute;

// MukonoTalks

