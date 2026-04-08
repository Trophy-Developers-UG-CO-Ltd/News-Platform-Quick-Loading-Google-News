/**
 * Register page
 * B2B registration with company details
 * @module pages/Register
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { register, clearError } from '../features/auth/authSlice';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiBriefcase, FiPhone, FiCheckSquare } from 'react-icons/fi';
import Spinner from '../components/ui/Spinner';
import LocalizedLink from '../components/i18n/LocalizedLink';

const companyTypes = [
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'retailer', label: 'Retailer' },
  { value: 'laboratory', label: 'Laboratory / Research' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' },
];

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companyType: '',
    phone: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword, companyName, companyType } = formData;
    if (!name || !email || !password || !companyName || !companyType) {
      toast.error(t('register.errors.requiredFields', 'Please fill in all required fields'));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('register.errors.passwordMismatch', 'Passwords do not match'));
      return;
    }
    if (password.length < 8) {
      toast.error(t('register.errors.passwordLength', 'Password must be at least 8 characters'));
      return;
    }
    if (!acceptedTerms) {
      toast.error(t('register.errors.acceptTerms', 'You must accept the Terms & Conditions to register'));
      return;
    }
    dispatch(register({ ...formData, acceptedTermsAt: new Date().toISOString() }));
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="card max-w-lg w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Create An Account - Advertising/ Personal Account </h1>
          <p className="text-gray-500 mt-1">Register to MukonoTalks</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="+000 000 000 000"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="you@gmail.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <div className="relative">
                <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Acme Coatings"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Type *</label>
              <select
                name="companyType"
                value={formData.companyType}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select type</option>
                {companyTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Min 8 characters"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm *</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Repeat password"
                  required
                />
              </div>
            </div>
          </div>

          {/* Terms & Conditions Acceptance */}
          <div className="bg-gray-50 rounded-lg p-4 mt-2">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">
                {t('register.termsAcceptance', 'I have read and agree to the')}{' '}
                <LocalizedLink to="/terms" className="text-primary-600 hover:underline font-medium" target="_blank">
                  {t('footer.termsConditions', 'Terms & Conditions')}
                </LocalizedLink>{' '}
                {t('common.and', 'and')}{' '}
                <LocalizedLink to="/privacy" className="text-primary-600 hover:underline font-medium" target="_blank">
                  {t('footer.privacyPolicy', 'Privacy Policy')}
                </LocalizedLink>
                <span className="text-red-500">*</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading || !acceptedTerms}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Spinner size="sm" /> : null}
            {isLoading ? t('register.creating', 'Creating Account...') : t('register.submit', 'Create Account')}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

// MukonoTalks

