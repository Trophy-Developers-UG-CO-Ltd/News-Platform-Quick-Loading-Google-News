/**
 * useAuth hook
 * Quick access to auth state
 * @module hooks/useAuth
 */

import { useSelector } from 'react-redux';

const useAuth = () => {
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin: user?.role === 'admin' || user?.role === 'developer',
    isDeveloper: user?.role === 'developer',
    isApproved: user?.isApproved === true,
  };
};

export default useAuth;

// MukonoTalks

