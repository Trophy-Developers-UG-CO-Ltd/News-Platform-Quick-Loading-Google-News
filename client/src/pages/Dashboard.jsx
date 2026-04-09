/**
 * User Dashboard page
 * Account overview with profile and quick links
 * @module pages/Dashboard
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { updateProfile, logout } from '../features/auth/authSlice';
import authService from '../features/auth/authService';
import { FiPackage, FiShoppingCart, FiUser, FiSave, FiShield, FiAlertTriangle, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import LocalizedLink from '../components/i18n/LocalizedLink';

const Dashboard = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deactivateReason, setDeactivateReason] = useState('');
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    companyName: user?.companyName || '',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await dispatch(updateProfile(form)).unwrap();
      toast.success(t('dashboard.profileUpdated', 'Profile updated'));
      setEditing(false);
    } catch (err) {
      toast.error(err);
    }
    setLoading(false);
  };

  const handleDeactivate = async () => {
    if (!deactivatePassword) {
      toast.error(t('dashboard.deactivate.passwordRequired', 'Password is required'));
      return;
    }
    
    setDeactivating(true);
    try {
      await authService.deactivateAccount(deactivatePassword, deactivateReason);
      toast.success(t('dashboard.deactivate.success', 'Account deactivated successfully'));
      dispatch(logout());
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || t('dashboard.deactivate.error', 'Failed to deactivate account'));
    }
    setDeactivating(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Profile Information</h2>
              {!editing && (
                <button onClick={() => setEditing(true)} className="btn-secondary text-sm">
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-1">
                    {loading ? <Spinner size="sm" /> : <FiSave />} Save
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center">
                    <FiUser className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-gray-500">Company</p>
                    <p className="font-medium">{user?.companyName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Company Type</p>
                    <p className="font-medium">{user?.companyType || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium">{user?.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Account Status</p>
                    <p className="font-medium">
                      {user?.isApproved ? (
                        <span className="text-green-600 flex items-center gap-1"><FiShield /> Approved</span>
                      ) : (
                        <span className="text-yellow-600">Pending Approval</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions removed as requested */}
      </div>

      {/* Danger Zone */}
      <div className="mt-8">
        <div className="border border-red-200 rounded-lg p-6 bg-red-50">
          <div className="flex items-center space-x-2 mb-4">
            <FiAlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-800">{t('dashboard.dangerZone', 'Danger Zone')}</h2>
          </div>
          
          {!showDeactivate ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{t('dashboard.deactivate.title', 'Deactivate Account')}</p>
                <p className="text-xs text-gray-500">{t('dashboard.deactivate.description', 'Permanently deactivate your account and delete your personal data')}</p>
              </div>
              <button
                onClick={() => setShowDeactivate(true)}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <FiTrash2 className="h-4 w-4" />
                <span>{t('dashboard.deactivate.button', 'Deactivate')}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 font-medium mb-3">
                  {t('dashboard.deactivate.warning', 'This action is irreversible. Your account will be permanently deactivated and your personal data will be anonymized.')}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('dashboard.deactivate.confirmPassword', 'Enter your password to confirm')} *
                    </label>
                    <input
                      type="password"
                      value={deactivatePassword}
                      onChange={(e) => setDeactivatePassword(e.target.value)}
                      className="input-field w-full max-w-sm"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('dashboard.deactivate.reason', 'Reason for leaving (optional)')}
                    </label>
                    <select
                      value={deactivateReason}
                      onChange={(e) => setDeactivateReason(e.target.value)}
                      className="input-field w-full max-w-sm"
                    >
                      <option value="">{t('dashboard.deactivate.selectReason', 'Select a reason')}</option>
                      <option value="no_longer_needed">{t('dashboard.deactivate.reasons.noLongerNeeded', 'No longer need the service')}</option>
                      <option value="privacy_concerns">{t('dashboard.deactivate.reasons.privacy', 'Privacy concerns')}</option>
                      <option value="switching_provider">{t('dashboard.deactivate.reasons.switching', 'Switching to another provider')}</option>
                      <option value="other">{t('dashboard.deactivate.reasons.other', 'Other')}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleDeactivate}
                  disabled={deactivating || !deactivatePassword}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {deactivating ? <Spinner size="sm" /> : <FiTrash2 className="h-4 w-4" />}
                  <span>{deactivating ? t('common.processing', 'Processing...') : t('dashboard.deactivate.confirmButton', 'Yes, Deactivate My Account')}</span>
                </button>
                <button
                  onClick={() => {
                    setShowDeactivate(false);
                    setDeactivatePassword('');
                    setDeactivateReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// MukonoTalks

