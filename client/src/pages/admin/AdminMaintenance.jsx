/**
 * AdminMaintenance — Maintenance Mode Control Panel
 * Developer-only feature to toggle site maintenance mode.
 * @module pages/admin/AdminMaintenance
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMaintenanceStatus, toggleMaintenance } from '../../features/maintenance/maintenanceSlice';
import { Wrench, Power, Save, AlertTriangle, Clock, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminMaintenance = () => {
  const dispatch = useDispatch();
  const { isEnabled, message, estimatedEnd, isLoading, isSaving, error, hasLoaded } = useSelector(
    (s) => s.maintenance
  );

  const [form, setForm] = useState({
    isEnabled: false,
    message: '',
    estimatedEnd: '',
  });

  // Sync form when Redux state loads
  useEffect(() => {
    setForm({
      isEnabled,
      message: message || '',
      estimatedEnd: estimatedEnd
        ? new Date(estimatedEnd).toISOString().slice(0, 16) // datetime-local format
        : '',
    });
  }, [isEnabled, message, estimatedEnd]);

  // Fetch on mount
  useEffect(() => {
    if (hasLoaded) return;
    dispatch(fetchMaintenanceStatus());
  }, [dispatch, hasLoaded]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      isEnabled: form.isEnabled,
      message: form.message,
      estimatedEnd: form.estimatedEnd ? new Date(form.estimatedEnd).toISOString() : null,
    };

    try {
      await dispatch(toggleMaintenance(payload)).unwrap();
      toast.success(
        payload.isEnabled
          ? 'Maintenance mode activated — site is now blocked for visitors'
          : 'Maintenance mode deactivated — site is live'
      );
    } catch (err) {
      toast.error(err || 'Failed to update maintenance mode');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <Wrench className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Mode</h1>
          <p className="text-sm text-gray-500">
            Block website access for all users except developers
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Developer privileges inherit all super admin privileges, and only developers can turn maintenance mode on or off.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {/* Status banner */}
      {isEnabled && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Maintenance mode is currently ACTIVE</p>
            <p className="text-sm text-amber-700 mt-1">
              All visitors and admin users are blocked from accessing the site.
              Only developers can access the site while maintenance mode is active.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {/* Toggle */}
        <div className="p-6">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Power className={`w-5 h-5 ${form.isEnabled ? 'text-red-500' : 'text-gray-400'}`} />
              <div>
                <p className="font-medium text-gray-900">Enable Maintenance Mode</p>
                <p className="text-sm text-gray-500">
                  When enabled, all non-developer users will see a maintenance page
                </p>
              </div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                name="isEnabled"
                checked={form.isEnabled}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-checked:bg-red-500 rounded-full transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
          </label>
        </div>

        {/* Message */}
        <div className="p-6 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <MessageSquare className="w-4 h-4" />
              Maintenance Message
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              placeholder="We are currently performing scheduled maintenance. Please check back soon."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{form.message.length}/500 characters</p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Clock className="w-4 h-4" />
              Estimated End Time
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="datetime-local"
              name="estimatedEnd"
              value={form.estimatedEnd}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="p-6">
          <button
            type="submit"
            disabled={isSaving}
            className={`
              inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors
              ${form.isEnabled
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
              }
              disabled:opacity-60 disabled:cursor-not-allowed
            `}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : form.isEnabled ? 'Activate Maintenance' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminMaintenance;

// MukonoTalks

