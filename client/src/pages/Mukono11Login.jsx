/**
 * Mukono11Login — Private login portal for admin & subscriber accounts.
 * Accessible at /mukono11login
 * @module pages/Mukono11Login
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../features/auth/authSlice';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiShield } from 'react-icons/fi';
import Spinner from '../components/ui/Spinner';

const ROLE_REDIRECT = {
  admin:     '/admin',
  developer: '/admin',
  customer:  '/',
};

const Mukono11Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

  const from = location.state?.from?.pathname || null;

  useEffect(() => {
    if (isAuthenticated && user) {
      const destination = from || ROLE_REDIRECT[user.role] || '/';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    dispatch(login({ email: trimmedEmail, password }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-body dark:bg-dark-charcoal px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#0a0a0a]/10 ring-1 ring-[#0a0a0a]/25 dark:bg-[#f4f4f4]/10 dark:ring-[#f4f4f4]/25">
            <FiShield className="h-7 w-7 text-[#0a0a0a] dark:text-[#f4f4f4]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#0a0a0a] dark:text-[#f4f4f4]">
            MukonoTalks Portal
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Login with your account to access exclusive features and manage your MukonoTalks experience.
          </p>
        </div>

        {/* Card */}
        <div className="card rounded-2xl p-8 shadow-glow">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="mt11-email"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                Email address
              </label>
              <div className="relative">
                <FiMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52525b] dark:text-[#a1a1aa]" />
                <input
                  id="mt11-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-9"
                  placeholder="you@mukonotalks.ug"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="mt11-password"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                Password
              </label>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52525b] dark:text-[#a1a1aa]" />
                <input
                  id="mt11-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-9 pr-20"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#52525b] hover:text-[#0a0a0a] dark:text-[#a1a1aa] dark:hover:text-[#f4f4f4] transition-colors"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[26px] bg-[#0a0a0a] text-[#ffffff] hover:bg-[#262626] dark:bg-[#f4f4f4] dark:text-[#0a0a0a] dark:hover:bg-[#e5e5e5] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dark-border focus:ring-offset-2 focus:ring-offset-light-body dark:focus:ring-offset-dark-charcoal disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  <span>Signing in…</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>

        {/* Subtle branding */}
        <p className="mt-6 text-center text-xs text-text-muted/50">
          MukonoTalks &mdash; restricted portal
        </p>
      </div>
    </div>
  );
};

export default Mukono11Login;

// MukonoTalks: Designed by Trophy Developers Uganda · https://www.trophydevelopers.com/uganda-web-designers/
